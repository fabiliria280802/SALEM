import os
import json
import torch
import torch.nn as nn
from PIL import Image
import torchvision
from torchvision import transforms as T
from torch.utils.data import DataLoader, Dataset, SubsetRandomSampler
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np

from utils import load_document_schema, convert_pdf_to_images

class DocumentDataset(Dataset):
    def __init__(self, file_paths, document_type, transforms=None):
        self.file_paths = file_paths
        self.transforms = transforms
        self.document_type = document_type
        self.schema = load_document_schema()[document_type]["fields"]

        self.num_classes = 3
        self.field_names = list(self.schema.keys())

        print(f"Inicializando Dataset para {document_type}")
        print(f"Campos del schema: {self.field_names}")
        print(f"Número de clases: {self.num_classes}")

        if len(self.file_paths) == 0:
            raise ValueError(f"No se encontraron archivos válidos para {document_type}")

        print(f"Cargados {len(self.file_paths)} documentos de tipo {document_type} para entrenamiento")

        if document_type == "Invoice":
            self.label = 0
        elif document_type == "ServiceDeliveryRecord":
            self.label = 1
        elif document_type == "Contract":
            self.label = 2

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        file_path = self.file_paths[idx]
        try:
            if file_path.endswith('.pdf'):
                image = convert_pdf_to_images(file_path)[0]  # Convierte PDF a imagen
            elif file_path.endswith('.png'):
                image = Image.open(file_path).convert('RGB')  # Abre la imagen PNG
            elif file_path.endswith('.xml'):
                import xml.etree.ElementTree as ET
                tree = ET.parse(file_path)
                root = tree.getroot()
                # Asume un tamaño fijo para los vectores (rellenados con ceros si es necesario)
                data_vector = torch.zeros(10)  # Longitud fija de 10
                for i, field in enumerate(self.field_names[:10]):  # Limita a los primeros 10 campos
                    value = root.find(field).text if root.find(field) is not None else 0
                    try:
                        data_vector[i] = float(value)
                    except ValueError:
                        data_vector[i] = 0
                return data_vector, torch.tensor(self.label, dtype=torch.long)


            # Redimensiona la imagen
            image = image.resize((400, 400), Image.Resampling.LANCZOS)

            # Aplica transformaciones, si existen
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

def custom_collate(batch):
    images = []
    labels = []

    for data, label in batch:
        if isinstance(data, torch.Tensor) and len(data.shape) == 1:  # Es un vector (XML)
            # Convierte el vector a una imagen simulada (3 canales, 400x400)
            # Asume que el vector tiene longitud fija (por ejemplo, 10)
            vector_as_image = data.unsqueeze(0).repeat(3, 1, 1)  # Crea un "mapa" 3x10x10
            padded_image = torch.zeros(3, 400, 400)  # Imagen simulada con ceros
            padded_image[:, :10, :10] = vector_as_image  # Coloca el vector en la esquina superior izquierda
            images.append(padded_image)
        elif len(data.shape) == 3 and data.shape[1:] == (400, 400):  # Es una imagen válida
            images.append(data)
        else:
            print(f"Datos inesperados: {data.shape}")
            continue
        labels.append(label)

    # Apilar los tensores
    return torch.stack(images), torch.tensor(labels)

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
        drop_last=True,
        collate_fn=custom_collate
    )

    val_loader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=val_sampler,
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=True,
        prefetch_factor=2,
        drop_last=True,
        collate_fn=custom_collate
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
