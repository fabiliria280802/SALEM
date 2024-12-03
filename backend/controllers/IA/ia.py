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
import torchvision
from torchvision.models import ResNet50_Weights
from torchvision.models.detection import FasterRCNN
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision import transforms as T
from torch.utils.data import DataLoader, Dataset
from sklearn.model_selection import KFold
from torch.optim.lr_scheduler import ReduceLROnPlateau
import warnings
from datetime import datetime

warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

class DocumentDataset(Dataset):
    def __init__(self, dataset_path, document_type, transforms=None):
        self.dataset_path = dataset_path
        self.transforms = transforms
        self.document_type = document_type
        self.schema = load_document_schema()[document_type]["fields"]
        self.num_classes = len(self.schema)
        self.field_names = list(self.schema.keys())

        print(f"Inicializando Dataset para {document_type}")
        print(f"Campos del schema: {self.field_names}")
        print(f"Número de clases: {self.num_classes}")

        # Filtrar archivos según el tipo de documento
        self.files = []
        for f in sorted(os.listdir(dataset_path)):
            if f.endswith((".pdf", ".png", ".jpg")):
                if document_type == "Invoice" and f.startswith("factura"):
                    self.files.append(f)
                elif document_type == "HES" and f.startswith("HES"):
                    self.files.append(f)
                elif document_type == "MIGO" and f.startswith("MIGO"):
                    self.files.append(f)

        if len(self.files) == 0:
            raise ValueError(f"No se encontraron archivos válidos para {document_type}")

        print(f"Cargados {len(self.files)} documentos de tipo {document_type} para entrenamiento")

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        file_path = os.path.join(self.dataset_path, self.files[idx])

        try:
            if file_path.endswith('.pdf'):
                image = self.convert_pdf_to_image(file_path)
            else:
                image = Image.open(file_path).convert('RGB')

            image = image.resize((800, 800), Image.LANCZOS)

            if self.transforms:
                image = self.transforms(image)
            else:
                image = T.ToTensor()(image)

            # Crear etiqueta basada en el índice del campo en el schema
            label = idx % self.num_classes
            #print(f"Archivo: {self.files[idx]}, Label: {label}, Campo: {self.field_names[label]}")

            return image, torch.tensor(label, dtype=torch.long)

        except Exception as e:
            print(f"Error procesando archivo {file_path}: {str(e)}")
            return torch.zeros((3, 800, 800)), torch.tensor(0, dtype=torch.long)

    @staticmethod
    def convert_pdf_to_image(pdf_path):
        """Convierte la primera página de un PDF en una imagen RGB usando PyMuPDF."""
        try:
            doc = fitz.open(pdf_path)
            page = doc.load_page(0)
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            doc.close()
            return img
        except Exception as e:
            print(f"Error convirtiendo PDF a imagen: {str(e)}")
            raise

    def get_transforms(self):
        """Retorna las transformaciones de datos para entrenamiento."""
        return T.Compose([
            T.RandomResizedCrop(800),
            T.RandomHorizontalFlip(),
            T.ColorJitter(brightness=0.2, contrast=0.2),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

class EarlyStopping:
    def __init__(self, patience=7, min_delta=0, verbose=True):
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

        # Usar un modelo preentrenado como backbone
        self.backbone = torchvision.models.resnet50(weights=ResNet50_Weights.IMAGENET1K_V1)

        # Congelar las primeras capas
        for param in list(self.backbone.parameters())[:-20]:
            param.requires_grad = False

        # Modificar la última capa para nuestro número de clases
        num_ftrs = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Linear(num_ftrs, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler,
                device, num_epochs, model_path, patience=7):
    early_stopping = EarlyStopping(patience=patience, verbose=True)

    history = {
        'train_loss': [],
        'val_loss': [],
        'train_acc': [],
        'val_acc': []
    }

    for epoch in range(num_epochs):
        print(f'Epoch {epoch+1}/{num_epochs}')
        print('-' * 10)

        # Entrenamiento
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, (inputs, targets) in enumerate(train_loader):
            try:
                inputs = inputs.to(device)
                targets = targets.to(device)

                # Asegurarse de que targets tenga la dimensión correcta
                if len(targets.shape) == 1:
                    targets = targets.long()  # Convertir a índices de clase

                optimizer.zero_grad()
                outputs = model(inputs)

                # Asegurarse de que outputs y targets tengan las dimensiones correctas
                if len(outputs.shape) == 2 and len(targets.shape) == 1:
                    loss = criterion(outputs, targets)
                else:
                    print(f"Dimensiones incorrectas - outputs: {outputs.shape}, targets: {targets.shape}")
                    continue

                loss.backward()
                optimizer.step()

                train_loss += loss.item()
                _, predicted = outputs.max(1)
                train_total += targets.size(0)
                train_correct += predicted.eq(targets).sum().item()

                if batch_idx % 10 == 0:  # Reducido de 100 a 10 para ver más actualizaciones
                    print(f'Batch: {batch_idx}/{len(train_loader)}, Loss: {loss.item():.4f}')
                    print(f'Dimensiones - outputs: {outputs.shape}, targets: {targets.shape}')

            except Exception as e:
                print(f"Error en batch {batch_idx}: {str(e)}")
                continue

        # Validación
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for inputs, targets in val_loader:
                try:
                    inputs = inputs.to(device)
                    targets = targets.to(device)

                    if len(targets.shape) == 1:
                        targets = targets.long()

                    outputs = model(inputs)
                    loss = criterion(outputs, targets)

                    val_loss += loss.item()
                    _, predicted = outputs.max(1)
                    val_total += targets.size(0)
                    val_correct += predicted.eq(targets).sum().item()

                except Exception as e:
                    print(f"Error en validación: {str(e)}")
                    continue

        # Calcular métricas
        epoch_train_loss = train_loss / len(train_loader) if len(train_loader) > 0 else float('inf')
        epoch_val_loss = val_loss / len(val_loader) if len(val_loader) > 0 else float('inf')
        epoch_train_acc = 100. * train_correct / train_total if train_total > 0 else 0
        epoch_val_acc = 100. * val_correct / val_total if val_total > 0 else 0

        # Actualizar scheduler
        scheduler.step(epoch_val_loss)

        # Guardar métricas
        history['train_loss'].append(epoch_train_loss)
        history['val_loss'].append(epoch_val_loss)
        history['train_acc'].append(epoch_train_acc)
        history['val_acc'].append(epoch_val_acc)

        print(f'Train Loss: {epoch_train_loss:.4f}, Val Loss: {epoch_val_loss:.4f}')
        print(f'Train Acc: {epoch_train_acc:.2f}%, Val Acc: {epoch_val_acc:.2f}%')

        # Early Stopping
        early_stopping(epoch_val_loss, model, model_path)
        if early_stopping.early_stop:
            print("Early stopping triggered")
            break

    return history

def cross_validate(dataset, k_folds=5):
    # Obtener el schema y número de clases del tipo de documento
    schema = load_document_schema()[dataset.document_type]["fields"]
    num_classes = len(schema)
    print(f"Schema cargado para {dataset.document_type}:")
    print(f"Campos disponibles: {list(schema.keys())}")
    print(f"Número de clases: {num_classes}")

    results = []
    kfold = KFold(n_splits=k_folds, shuffle=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    for fold, (train_ids, val_ids) in enumerate(kfold.split(dataset)):
        print(f'FOLD {fold+1}/{k_folds}')
        print('-' * 10)

        # Calcular tamaño de batch apropiado
        batch_size = min(32, len(train_ids))  # Ajustar batch_size según cantidad de datos
        print(f"Tamaño de batch para este fold: {batch_size}")

        train_subsampler = torch.utils.data.SubsetRandomSampler(train_ids)
        val_subsampler = torch.utils.data.SubsetRandomSampler(val_ids)

        train_loader = DataLoader(
            dataset,
            batch_size=batch_size,
            sampler=train_subsampler,
            num_workers=4,
            pin_memory=True
        )

        val_loader = DataLoader(
            dataset,
            batch_size=batch_size,
            sampler=val_subsampler,
            num_workers=4,
            pin_memory=True
        )

        print(f"Tamaño del conjunto de entrenamiento: {len(train_ids)}")
        print(f"Tamaño del conjunto de validación: {len(val_ids)}")
        print(f"Número de batches en train_loader: {len(train_loader)}")
        print(f"Número de batches en val_loader: {len(val_loader)}")

        # Crear modelo con el número correcto de clases
        model = DocumentCNN(num_classes).to(device)
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(model.parameters(), lr=0.001, weight_decay=0.01)
        scheduler = ReduceLROnPlateau(optimizer, mode='min', factor=0.1, patience=3, verbose=True)

        # Entrenar modelo
        history = train_model(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            num_epochs=50,
            model_path=f'model_fold_{fold+1}.pth',
            patience=7
        )

        results.append(history)

        with open(f'results_fold_{fold+1}.json', 'w') as f:
            json.dump(history, f)

    return results

def validate_ecuadorian_cedula(cedula):

    if len(cedula) != 10:
        return False

    try:
        province_code = int(cedula[0:2])
        third_digit = int(cedula[2])

        if province_code < 1 or province_code > 24:
            return False

        if third_digit >= 6:
            return False

        coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
        total = 0

        for i in range(9):
            result = int(cedula[i]) * coefficients[i]
            if result >= 10:
                result -= 9
            total += result

        verifier_digit = (10 - (total % 10)) % 10
        return verifier_digit == int(cedula[9])
    except (ValueError, IndexError):
        return False

def validate_ruc(ruc):

    if len(ruc) != 13:
        return False

    try:
        province_code = int(ruc[0:2])
        third_digit = int(ruc[2])

        if province_code < 1 or province_code > 24:
            return False

        if third_digit == 9:
            return ruc[10:13] == '001'

        if third_digit == 6:
            return ruc[10:13] == '001'

        if third_digit < 6 and validate_ecuadorian_cedula(ruc[0:10]):
            return ruc[10:13] == '001'

        return False
    except (ValueError, IndexError):
        return False

def get_best_model_path(document_type):
    """
    Determina el mejor modelo para cada tipo de documento
    """
    best_val_loss = float('inf')
    best_model_path = None

    # Revisar los resultados de cada fold
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
    """Convierte todas las páginas de un PDF en imágenes."""
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
    """
    Procesa un documento tipo factura según el schema definido
    """
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    invoice_fields = schema["Invoice"]["fields"]

    # Procesar cada campo según el schema
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

    # Validaciones específicas para facturas
    if all(k in extracted_data for k in ['subtotal', 'descuento_porcentaje', 'descuento', 'subtotal_con_descuento', 'iva', 'total']):
        try:
            subtotal = float(extracted_data['subtotal'])
            descuento_porcentaje = float(extracted_data['descuento_porcentaje'])
            descuento = float(extracted_data['descuento'])
            subtotal_con_descuento = float(extracted_data['subtotal_con_descuento'])
            iva = float(extracted_data['iva'])
            total = float(extracted_data['total'])

            # Validar porcentaje de descuento
            if descuento_porcentaje not in [0, 5, 10, 15, 20]:
                validation_errors.append("Porcentaje de descuento inválido")

            # Validar cálculo de descuento
            calculated_descuento = round(subtotal * descuento_porcentaje / 100, 2)
            if abs(calculated_descuento - descuento) > 0.01:
                validation_errors.append("Error en cálculo del descuento")

            # Validar subtotal con descuento
            calculated_subtotal_con_descuento = round(subtotal - descuento, 2)
            if abs(calculated_subtotal_con_descuento - subtotal_con_descuento) > 0.01:
                validation_errors.append("Error en cálculo del subtotal con descuento")

            # Validar IVA (15%)
            calculated_iva = round(subtotal_con_descuento * 0.15, 2)
            if abs(calculated_iva - iva) > 0.01:
                validation_errors.append("Error en cálculo del IVA")

            # Validar total
            calculated_total = round(subtotal_con_descuento + iva, 2)
            if abs(calculated_total - total) > 0.01:
                validation_errors.append("Error en cálculo del total")

        except ValueError:
            validation_errors.append("Error en conversión de valores numéricos")

    # Validar formato del número de factura
    if 'factura_number' in extracted_data:
        if not re.match(r'^invoice-\d{6}$', extracted_data['factura_number']):
            validation_errors.append("Formato de número de factura inválido")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_service_delivery_record(image, schema, text):
    """
    Procesa un documento tipo acta de entrega de servicio según el schema definido
    """
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    record_fields = schema["ServiceDeliveryRecord"]["fields"]

    # Procesar cada campo según el schema
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

    # Validaciones específicas
    if 'hes_number' in extracted_data:
        if not re.match(r'^record-\d{3}$', extracted_data['hes_number']):
            validation_errors.append("Formato de número HES inválido")

    if 'contrato' in extracted_data:
        if not re.match(r'^contract-\d{4}$', extracted_data['contrato']):
            validation_errors.append("Formato de número de contrato inválido")

    # Validar fechas
    if 'fecha_inicio' in extracted_data and 'fecha_termino' in extracted_data:
        try:
            fecha_inicio = datetime.strptime(extracted_data['fecha_inicio'], '%d/%m/%Y')
            fecha_termino = datetime.strptime(extracted_data['fecha_termino'], '%d/%m/%Y')
            if fecha_termino < fecha_inicio:
                validation_errors.append("La fecha de término no puede ser anterior a la fecha de inicio")
        except ValueError:
            validation_errors.append("Formato de fechas inválido")

    # Validar firmas
    if 'firmas' in extracted_data:
        firmas = extracted_data['firmas']
        if not isinstance(firmas, list) or len(firmas) != 2:
            validation_errors.append("Se requieren exactamente dos firmas")
        else:
            tipos_esperados = set(['Proveedor', 'Receptor'])
            tipos_encontrados = set(firma['tipo'] for firma in firmas)
            if tipos_esperados != tipos_encontrados:
                validation_errors.append("Se requiere una firma de Proveedor y una de Receptor")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_contract_document(image, schema, text):
    """
    Procesa un documento tipo contrato según el schema definido
    """
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    contract_fields = schema["Contract"]["fields"]

    # Procesar cada campo según el schema
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

    # Validaciones específicas
    if 'contrato_number' in extracted_data:
        if not re.match(r'^contract-\d{4}$', extracted_data['contrato_number']):
            validation_errors.append("Formato de número de contrato inválido")

    # Validar fechas
    if 'fecha_inicio' in extracted_data and 'fecha_termino' in extracted_data:
        try:
            fecha_inicio = datetime.strptime(extracted_data['fecha_inicio'], '%d/%m/%Y')
            fecha_termino = datetime.strptime(extracted_data['fecha_termino'], '%d/%m/%Y')
            if fecha_termino < fecha_inicio:
                validation_errors.append("La fecha de término no puede ser anterior a la fecha de inicio")
        except ValueError:
            validation_errors.append("Formato de fechas inválido")

    # Validar empresas
    if 'empresa_contratante' in extracted_data and 'empresa_contratada' in extracted_data:
        if extracted_data['empresa_contratante'] == extracted_data['empresa_contratada']:
            validation_errors.append("La empresa contratante no puede ser la misma que la contratada")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def validate_hes_company(extracted_data, validation_errors):
    if 'receiving_company' in extracted_data:
        if extracted_data['receiving_company'] != "ENAP SIPETROL S.A.":
            validation_errors.append("Empresa receptora inválida")

def validate_hes_title(extracted_data, validation_errors):
    if 'title' in extracted_data:
        if extracted_data['title'] != "ACTA DE ENTREGA DE SERVICIO":
            validation_errors.append("Título del documento inválido")

def validate_hes_dates(extracted_data, validation_errors):
    if 'start_date' in extracted_data and 'end_date' in extracted_data:
        try:
            start_date = datetime.strptime(extracted_data['start_date'], '%d/%m/%Y')
            end_date = datetime.strptime(extracted_data['end_date'], '%d/%m/%Y')
            if end_date < start_date:
                validation_errors.append("La fecha de término no puede ser anterior a la fecha de inicio")
        except ValueError:
            validation_errors.append("Error en formato de fechas")

def validate_hes_signatures(extracted_data, validation_errors):
    if 'signatures' in extracted_data and isinstance(extracted_data['signatures'], list):
        for idx, signature in enumerate(extracted_data['signatures']):
            if not all(key in signature for key in ['first_name', 'title_and_full_name', 'role']):
                validation_errors.append(f"Firma {idx + 1} incompleta")

def process_hes_document(image, schema, text):
    """Procesa un documento tipo HES (Hoja de Entrega de Servicio)"""
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    # Procesar campos según schema
    for field_name, field_info in schema["HES"]["fields"].items():
        process_field(field_name, text, field_info, extracted_data,
                     confidence_scores, validation_errors, missing_fields)

    # Ejecutar validaciones
    validate_hes_company(extracted_data, validation_errors)
    validate_hes_title(extracted_data, validation_errors)
    validate_hes_dates(extracted_data, validation_errors)
    validate_hes_signatures(extracted_data, validation_errors)

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def validate_migo_title(extracted_data, validation_errors):
    if 'title' in extracted_data:
        if extracted_data['title'] != "NOTA DE ENTREGA":
            validation_errors.append("Título del documento inválido")

def validate_migo_number(extracted_data, validation_errors):
    if 'migo_number' in extracted_data:
        if not re.match(r'^MIGO\d{3,}-\w+$', extracted_data['migo_number']):
            validation_errors.append("Número de MIGO inválido")

def validate_migo_date(extracted_data, validation_errors):
    if 'date' in extracted_data:
        try:
            datetime.strptime(extracted_data['date'], '%Y-%m-%d')
        except ValueError:
            validation_errors.append("Formato de fecha inválido")

def validate_migo_prices(extracted_data, validation_errors):
    if 'item_details' in extracted_data:
        for item in extracted_data['item_details']:
            try:
                quantity = float(item['quantity'])
                unit_price = float(item['unit_price'])
                total_price = float(item['total_price'])

                if abs(quantity * unit_price - total_price) > 0.01:
                    validation_errors.append("Error en cálculo de precios")
            except (ValueError, KeyError):
                validation_errors.append("Error en formato de precios")

def process_migo_document(image, schema, text):
    """Procesa un documento tipo MIGO (Nota de Entrega)"""
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    # Procesar campos según schema
    for field_name, field_info in schema["MIGO"]["fields"].items():
        process_field(field_name, text, field_info, extracted_data,
                     confidence_scores, validation_errors, missing_fields)

    # Ejecutar validaciones
    validate_migo_title(extracted_data, validation_errors)
    validate_migo_number(extracted_data, validation_errors)
    validate_migo_date(extracted_data, validation_errors)
    validate_migo_prices(extracted_data, validation_errors)

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_single_document(file_path, document_type):
    """
    Punto de entrada principal para procesar documentos
    """
    try:
        start_time = time.time()
        schema = load_document_schema()

        # Convertir documento a imagen
        if file_path.endswith('.pdf'):
            image = convert_pdf_to_image(file_path)
        else:
            image = Image.open(file_path).convert('RGB')

        # Extraer texto del documento
        text = pytesseract.image_to_string(image, lang='spa')

        # Procesar según tipo de documento
        if document_type == "Invoice":
            result = process_invoice_document(image, schema, text)
        elif document_type == "HES":
            result = process_hes_document(image, schema, text)
        elif document_type == "MIGO":
            result = process_migo_document(image, schema, text)
        else:
            raise ValueError(f"Tipo de documento no soportado: {document_type}")

        # Agregar información adicional al resultado
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

def get_field_region(model_outputs, field_name, document_type):
    if document_type == "Invoice":
        regions = {
            'invoice_number': (100, 100, 300, 150),
            'provider_ruc': (100, 150, 300, 200),
            'provider_name': (100, 200, 500, 250),
            'issue_date': (400, 100, 600, 150),
            'subtotal': (400, 500, 600, 550),
            'iva': (400, 550, 600, 600),
            'total': (400, 600, 600, 650)
        }
    elif document_type == "HES":
        regions = {
            'contract_number': (100, 100, 300, 150),
            'service_description': (100, 150, 500, 200),
            'provider_name': (100, 200, 500, 250),
            'location_and_date': (400, 100, 600, 150),
            'service_details': (100, 300, 700, 400),
            'service_total': (400, 500, 600, 550),
            'observations': (100, 600, 700, 650),
            'approvals': (100, 700, 700, 750)
        }
    return regions.get(field_name)

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

if __name__ == "__main__":
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if len(sys.argv) == 3:
        file_path = sys.argv[1]
        document_type = sys.argv[2]
        process_single_document(file_path, document_type)
    else:
        # Entrenamiento para cada tipo de documento
        try:
            for doc_type in ["Invoice","ServiceDeliveryRecord","Contract"]:
                print(f"\nIniciando entrenamiento para {doc_type}")
                dataset = DocumentDataset(dataset_path='../../data/practice', document_type=doc_type)
                print(f"Iniciando entrenamiento con {len(dataset)} documentos de tipo {doc_type}")
                results = cross_validate(dataset)

                # Guardar resultados específicos por tipo
                with open(f'training_results_{doc_type.lower()}.json', 'w') as f:
                    json.dump(results, f)

        except Exception as e:
            print(f"Error durante el entrenamiento: {str(e)}")

