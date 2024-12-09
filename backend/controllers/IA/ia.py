# TODO:
# - Añadir validaciones para los campos del schema
# - Añadir validaciones para los datos extraidos

import os
import re
import json
import sys
import torch
import torch.nn as nn
import pytesseract
import fitz
import time
from PIL import Image
from dotenv import load_dotenv
import psutil
import torch.cuda as cuda
import torchvision
from torchvision import transforms as T
from torch.utils.data import DataLoader, Dataset, SubsetRandomSampler
from torch.optim.lr_scheduler import ReduceLROnPlateau
import warnings
from datetime import datetime
import numpy as np

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

class DocumentDataset(Dataset):
    def __init__(self, dataset_path, document_type, transforms=None):
        self.dataset_path = dataset_path
        self.transforms = transforms
        self.document_type = document_type
        self.schema = load_document_schema()[document_type]["fields"]

        self.num_classes = 3
        self.field_names = list(self.schema.keys())

        print(f"Inicializando Dataset para {document_type}")
        print(f"Campos del schema: {self.field_names}")
        print(f"Número de clases: {self.num_classes}")

        self.files = []
        for f in sorted(os.listdir(dataset_path)):
            if f.endswith((".pdf", ".png", ".jpg")):
                if document_type == "Invoice" and f.startswith("invoice"):
                    self.files.append(f)
                elif document_type == "Contract" and f.startswith("contract"):
                    self.files.append(f)
                elif document_type == "ServiceDeliveryRecord" and f.startswith("record"):
                    self.files.append(f)

        if len(self.files) == 0:
            raise ValueError(f"No se encontraron archivos válidos para {document_type}")

        print(f"Cargados {len(self.files)} documentos de tipo {document_type} para entrenamiento")

        if document_type == "Invoice":
            self.label = 0
        elif document_type == "ServiceDeliveryRecord":
            self.label = 1
        elif document_type == "Contract":
            self.label = 2

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        file_path = os.path.join(self.dataset_path, self.files[idx])
        try:
            if file_path.endswith('.pdf'):
                image = convert_pdf_to_images(file_path)[0]
            else:
                image = Image.open(file_path).convert('RGB')

            image = image.resize((400, 400), Image.Resampling.LANCZOS)

            if self.transforms:
                image = self.transforms(image)
            else:
                image = T.ToTensor()(image)

            return image, torch.tensor(self.label, dtype=torch.long)

        except Exception as e:
            print(f"Error procesando archivo {file_path}: {str(e)}")
            return torch.zeros((3, 400, 400)), torch.tensor(self.label, dtype=torch.long)


class EarlyStopping:
    def __init__(self, patience=15, min_delta=0, verbose=True):
        self.patience = patience
        self.min_delta = min_delta
        self.verbose = verbose
        self.counter = 0
        self.best_loss = None
        self.early_stop = False
        self.val_loss_min = float('inf')

    def __call__(self, val_loss, model, path):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.save_checkpoint(val_loss, model, path)
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.verbose:
                print(f'EarlyStopping counter: {self.counter} out of {self.patience}')
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.save_checkpoint(val_loss, model, path)
            self.counter = 0

    def save_checkpoint(self, val_loss, model, path):
        if self.verbose:
            print(f'Validation loss decreased ({self.val_loss_min:.6f} --> {val_loss:.6f}). Saving model ...')
        torch.save(model.state_dict(), path)
        self.val_loss_min = val_loss

class DocumentCNN(nn.Module):
    def __init__(self, num_classes):
        super(DocumentCNN, self).__init__()
        # Intentar cargar EfficientNet sin pesos (para evitar descargas)
        try:
            self.backbone = torchvision.models.efficientnet_b0(weights=None)
            num_ftrs = self.backbone.classifier[1].in_features
            self.backbone.classifier = nn.Identity()
        except:
            print("No se pudo cargar EfficientNet, usando ResNet18 como alternativa")
            self.backbone = torchvision.models.resnet18(weights=None)
            num_ftrs = self.backbone.fc.in_features
            self.backbone.fc = nn.Identity()

        # Congelar capas base (ya lo tenemos)
        for param in self.backbone.parameters():
            param.requires_grad = False

        # Nueva cabeza de clasificación
        self.classifier = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        x = self.backbone(x)
        if isinstance(self.backbone, torchvision.models.ResNet):
            x = x.view(x.size(0), -1)
        return self.classifier(x)

def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler,
                device, num_epochs, model_path, patience=15):
    scaler = torch.cuda.amp.GradScaler()
    early_stopping = EarlyStopping(patience=patience, verbose=True)
    val_losses = []
    train_losses = []

    for epoch in range(num_epochs):
        model.train()
        running_train_loss = 0.0
        # Entrenamiento (sin cálculos innecesarios)
        for batch_idx, (inputs, targets) in enumerate(train_loader):
            inputs = inputs.to(device)
            targets = targets.to(device)

            with torch.cuda.amp.autocast():
                outputs = model(inputs)
                loss = criterion(outputs, targets)

            optimizer.zero_grad(set_to_none=True)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            running_train_loss += loss.item()

        # Validación
        model.eval()
        running_val_loss = 0.0
        with torch.no_grad():
            for inputs, targets in val_loader:
                inputs = inputs.to(device)
                targets = targets.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, targets)
                running_val_loss += loss.item()

        epoch_train_loss = running_train_loss / len(train_loader)
        epoch_val_loss = running_val_loss / len(val_loader)

        train_losses.append(epoch_train_loss)
        val_losses.append(epoch_val_loss)

        print(f"Epoch {epoch+1}/{num_epochs}: Train Loss: {epoch_train_loss:.4f}, Val Loss: {epoch_val_loss:.4f}")

        scheduler.step(epoch_val_loss)
        # Early stopping
        early_stopping(epoch_val_loss, model, model_path)
        if early_stopping.early_stop:
            print("Early stopping activado!")
            break

    return {"val_loss": val_losses, "train_loss": train_losses}

def train_single_fold(dataset, learning_dir, doc_type, current_fold, device):
    # Dividir dataset en train/val (80/20)
    dataset_size = len(dataset)
    indices = list(range(dataset_size))
    split = int(0.8 * dataset_size)
    np.random.shuffle(indices)
    train_indices, val_indices = indices[:split], indices[split:]

    # Ajustar batch_size según memoria GPU
    batch_size = 256 if torch.cuda.is_available() else 128
    # Ajustar num_workers según tus CPU (por ejemplo, 4)
    num_workers = 4

    train_sampler = SubsetRandomSampler(train_indices)
    val_sampler = SubsetRandomSampler(val_indices)

    # Ajustar prefetch_factor a 2 o 4 (según tu sistema)
    train_loader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=train_sampler,
        num_workers=num_workers,
        pin_memory=True,  # Si tienes GPU esto acelera la transferencia
        persistent_workers=True,
        prefetch_factor=2,
        drop_last=True
    )

    val_loader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=val_sampler,
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=True,
        prefetch_factor=2,
        drop_last=True
    )

    model = DocumentCNN(num_classes=dataset.num_classes).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
    scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=15, verbose=True)

    # Entrenar por 950 épocas con EarlyStopping
    model_path = os.path.join(learning_dir, f'model_fold_{doc_type.lower()}{current_fold}.pth')
    results = train_model(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        num_epochs=20,
        model_path=model_path,
        patience=15
    )

    # Guardar resultados
    results_path = os.path.join(learning_dir, f'training_results_{doc_type.lower()}{current_fold}.json')
    with open(results_path, 'w') as f:
        json.dump(results, f)

    return model

def get_best_model_path(document_type):
    # No se utiliza actualmente
    best_val_loss = float('inf')
    best_model_path = None

    for fold in range(1, 6):
        result_path = f'results_{document_type.lower()}_fold_{fold}.json'
        model_path = f'model_{document_type.lower()}_fold_{fold}.pth'

        if os.path.exists(result_path) and os.path.exists(model_path):
            with open(result_path, 'r') as f:
                results = json.load(f)
                min_val_loss = min(results['val_loss'])

                if min_val_loss < best_val_loss:
                    best_val_loss = min_val_loss
                    best_model_path = model_path

    if best_model_path is None:
        raise ValueError(f"No se encontraron modelos entrenados para {document_type}")

    print(f"Usando el mejor modelo para {document_type}: {best_model_path}")
    return best_model_path

def convert_pdf_to_images(pdf_path):
    try:
        doc = fitz.open(pdf_path)
        images = []
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)
        doc.close()
        return images
    except Exception as e:
        print(f"Error convirtiendo PDF a imágenes: {str(e)}")
        raise

def process_invoice_document(image, schema, text):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    invoice_fields = schema["Invoice"]["fields"]
    for field_name, field_info in invoice_fields.items():
        process_field(
            field_name,
            text,
            field_info,
            extracted_data,
            confidence_scores,
            validation_errors,
            missing_fields
        )

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_service_delivery_record(image, schema, text):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    record_fields = schema["ServiceDeliveryRecord"]["fields"]
    for field_name, field_info in record_fields.items():
        process_field(
            field_name,
            text,
            field_info,
            extracted_data,
            confidence_scores,
            validation_errors,
            missing_fields
        )

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_contract_document(image, schema, text):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    contract_fields = schema["Contract"]["fields"]
    for field_name, field_info in contract_fields.items():
        process_field(
            field_name,
            text,
            field_info,
            extracted_data,
            confidence_scores,
            validation_errors,
            missing_fields
        )

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def get_field_region(model_outputs, field_name, document_type):
    return None

def calculate_confidence(regex_match):
    if regex_match is None:
        return 0.0
    matched_text = regex_match.group(1)
    if len(matched_text) > 3:
        return 0.9
    return 0.5

def load_document_schema():
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'schemas.json')
    with open(schema_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def process_field(field_name, text, field_info, extracted_data, confidence_scores, validation_errors, missing_fields):
    try:
        regex = field_info.get('regex')
        if not regex:
            return
        match = re.search(regex, text)
        if match:
            extracted_data[field_name] = match.group(1)
            confidence_scores[field_name] = calculate_confidence(match)
        else:
            missing_fields.append(field_name)
    except Exception as e:
        validation_errors.append(f"Error procesando campo {field_name}: {str(e)}")

def process_single_document(file_path, document_type):
    try:
        start_time = time.time()
        schema = load_document_schema()

        if file_path.endswith('.pdf'):
            image = convert_pdf_to_images(file_path)[0]
        else:
            image = Image.open(file_path).convert('RGB')

        text = pytesseract.image_to_string(image, lang='spa')

        if document_type == "Invoice":
            result = process_invoice_document(image, schema, text)
        elif document_type == "ServiceDeliveryRecord":
            result = process_service_delivery_record(image, schema, text)
        elif document_type == "Contract":
            result = process_contract_document(image, schema, text)
        else:
            raise ValueError(f"Tipo de documento no soportado: {document_type}")

        result.update({
            "document_type": document_type,
            "processing_time": time.time() - start_time,
            "status": "Denegado" if result["validation_errors"] else "Aceptado",
            "ai_decision_explanation": (
                "Documento procesado correctamente"
                if not result["validation_errors"]
                else f"Documento denegado. Errores encontrados: {', '.join(result['validation_errors'])}"
            )
        })

        return result

    except Exception as e:
        error_result = {
            "error": str(e),
            "document_type": document_type,
            "status": "Denegado",
            "ai_decision_explanation": f"Error en el procesamiento: {str(e)}",
            "validation_errors": [str(e)]
        }
        print(json.dumps(error_result, indent=2))
        return error_result

if __name__ == "__main__":
    # Verificar si tenemos GPU
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if len(sys.argv) == 3:
        file_path = sys.argv[1]
        document_type = sys.argv[2]
        result = process_single_document(file_path, document_type)
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        learning_dir = os.path.join(os.path.dirname(__file__), 'learning')
        os.makedirs(learning_dir, exist_ok=True)

        current_fold = 1
        while True:
            try:
                for doc_type in ["Invoice", "ServiceDeliveryRecord", "Contract"]:
                    model_path = os.path.join(learning_dir, f'model_fold_{doc_type.lower()}{current_fold}.pth')

                    if os.path.exists(model_path):
                        print(f"Modelo {doc_type} para fold {current_fold} ya existe, saltando...")
                        continue

                    print(f"\nIniciando entrenamiento para {doc_type} - Fold {current_fold}")
                    dataset = DocumentDataset(dataset_path='../../data/practice', document_type=doc_type)
                    print(f"Iniciando entrenamiento con {len(dataset)} documentos de tipo {doc_type}")
                    train_single_fold(dataset, learning_dir, doc_type, current_fold, device)

                print(f"\nFold {current_fold} completado para todos los tipos de documentos!")
                response = input("\n¿Desea continuar con otro fold? (s/n): ").lower()
                if response not in ['s', 'si', 'yes', 'y']:
                    print("Entrenamiento detenido por el usuario")
                    break
                current_fold += 1

            except Exception as e:
                print(f"Error durante el entrenamiento: {str(e)}")
                break

        print("\nEntrenamiento finalizado!")
