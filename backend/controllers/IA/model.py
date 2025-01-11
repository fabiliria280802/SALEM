import torch
import torch.nn as nn
from timm import create_model
from torch.utils.data import DataLoader
from torchvision import transforms
import os

from my_custom_dataset import MyCustomDataset 
from config import CONFIG, CLASS_NAMES 

class MyEfficientNet(torch.nn.Module):
    def __init__(self, num_classes=3):
        super(MyEfficientNet, self).__init__()
        self.model = create_model('efficientnet_b0', pretrained=False, num_classes=num_classes)

    def forward(self, x):
        return self.model(x)

def load_model():
    """
    Carga el modelo entrenado desde best_model.pth
    """
    model = MyEfficientNet(num_classes=len(CLASS_NAMES))
    checkpoint_path = os.path.join(CONFIG["MODEL_SAVE_PATH"], "best_model.pth")
    model.load_state_dict(torch.load(checkpoint_path, map_location='cpu'))
    model.eval()
    return model

def classify_document(file_path):
    """
    Detecta el tipo de documento (Contract, Invoice o ServiceDeliveryRecord)
    a partir de una imagen o PDF/XML convertido a imagen.
    """

    # 1. Carga el modelo
    model = load_model()

    # 2. Procesa/convierte el archivo a imagen PIL
    pil_img = convert_to_pil_image(file_path)

    # 3. Aplica las transformaciones coherentes con tu entrenamiento
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        # Normalización si la usaste al entrenar
        # transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    img_tensor = transform(pil_img)  # shape [3, 224, 224]

    # 4. Pasa la imagen por el modelo (agregando batch dimension)
    img_tensor = img_tensor.unsqueeze(0)  # shape [1, 3, 224, 224]

    with torch.no_grad():
        outputs = model(img_tensor)           # shape [1, num_classes]
        probabilities = F.softmax(outputs, dim=1)  # shape [1, num_classes]
        predicted_idx = probabilities.argmax(dim=1).item()
        confidence = probabilities[0, predicted_idx].item()

    predicted_class = CLASS_NAMES[predicted_idx]

    # 5. Devuelve un dict con la clase y la confianza
    return {
        "predicted_class": predicted_class,
        "confidence": confidence
    }

def convert_to_pil_image(file_path):
    """
    Ejemplo simplificado para convertir un archivo a PIL.Image.
    - Si es .png/.jpg/.jpeg, simplemente se abre con PIL.
    - Si es PDF, convertimos la primera página con pdf2image.
    - Si es XML, podrías renderizar un placeholder o un texto en una imagen.
    Ajusta según tu necesidad real.
    """
    from pdf2image import convert_from_path
    from PIL import Image, ImageDraw

    lower_fp = file_path.lower()
    if lower_fp.endswith(('.png', '.jpg', '.jpeg')):
        return Image.open(file_path).convert("RGB")
    elif lower_fp.endswith('.pdf'):
        pages = convert_from_path(file_path, dpi=150)
        # Toma la primera página (puedes procesar más si lo deseas)
        return pages[0].convert("RGB")
    elif lower_fp.endswith('.xml'):
        # Renderiza un placeholder o extrae el texto y haz lo necesario
        img = Image.new("RGB", (400, 200), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((10,10), "XML placeholder", fill=(0,0,0))
        return img
    else:
        # En caso de formato desconocido, genera un placeholder
        img = Image.new("RGB", (400, 200), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.text((10,10), "Formato no soportado", fill=(255,0,0))
        return img

def train_model():
    """
    Entrena el modelo con tus datos de train y val.
    Guarda los pesos al final en best_model.pth (o donde definas).
    """

    # -----------------------------
    # 1. Transforms y Dataset
    # -----------------------------
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        # Agrega normalizaciones si deseas: 
        # transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_dir = os.path.join(CONFIG["TRAINING_DATA_PATH"], "train")
    val_dir   = os.path.join(CONFIG["TRAINING_DATA_PATH"], "val")

    # Si usas un dataset personalizado (mezcla PDFs, XML, PNG, etc.)
    train_dataset = MyCustomDataset(root=train_dir, transform=transform)
    val_dataset   = MyCustomDataset(root=val_dir,   transform=transform)

    print("Tamaño del train_dataset:", len(train_dataset))
    print("Tamaño del val_dataset:", len(val_dataset))


    # Si tus datos son únicamente imágenes, podrías usar:
    # from torchvision.datasets import ImageFolder
    # train_dataset = ImageFolder(train_dir, transform=transform)
    # val_dataset   = ImageFolder(val_dir,   transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_loader   = DataLoader(val_dataset,   batch_size=8, shuffle=False)

    

    # -----------------------------
    # 2. Crear modelo, define loss y optimizer
    # -----------------------------
    model = MyEfficientNet(num_classes=3)  # Ajusta a la cantidad de clases que tengas
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

    # Mueve el modelo a GPU si está disponible
    print(torch.cuda.is_available())
    if torch.cuda.is_available():
        device = torch.device("cuda")
    else:
        device = torch.device("cpu")

    model.to(device)

    best_val_acc = 0.0
    num_epochs = 5  # Ajusta según tu dataset

    # -----------------------------
    # 3. Bucle de entrenamiento
    # -----------------------------
    for epoch in range(num_epochs):
        # Modo training
        model.train()
        running_loss = 0.0

        for images, labels in train_loader:
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)  # [batch_size, num_classes]
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item()

        # Cálculo de loss promedio por batch
        train_loss = running_loss / len(train_loader)
        print(f"Época {epoch+1}/{num_epochs}, Pérdida: {train_loss}")
        # -----------------------------
        # 4. Validación
        # -----------------------------
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)

                outputs = model(images)
                _, predicted = torch.max(outputs, 1)

                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        val_acc = 100.0 * correct / total

        print(f"Epoch [{epoch+1}/{num_epochs}], Train Loss: {train_loss:.4f}, Val Acc: {val_acc:.2f}%")

        # Si la val_acc es la mejor hasta ahora, guarda el modelo
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), os.path.join(CONFIG["MODEL_SAVE_PATH"], "best_model.pth"))
            print(f"Nuevo mejor modelo guardado con val_acc = {val_acc:.2f}%")

    print("Entrenamiento finalizado.")
