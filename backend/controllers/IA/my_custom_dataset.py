import os
import glob
import torch
from torch.utils.data import Dataset
from pdf2image import convert_from_path
from PIL import Image

class MyCustomDataset(Dataset):
    def __init__(self, root, transform=None):
        self.root = root
        self.transform = transform
        self.samples = [] 
        self.classes = sorted(os.listdir(root)) 
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}

        for class_name in self.classes:
            class_dir = os.path.join(root, class_name)

            if not os.path.isdir(class_dir):
                continue

            label = self.class_to_idx[class_name]

            patterns = ["*.pdf", "*.PDF", "*.xml", "*.XML", "*.png", "*.PNG", "*.jpg", "*.JPG", "*.jpeg", "*.JPEG"]
            file_paths = []
            for p in patterns:
                file_paths.extend(glob.glob(os.path.join(class_dir, p)))

            for fpath in file_paths:
                self.samples.append((fpath, label))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        fpath, label = self.samples[idx]
        
        # 1. Convertir en imagen (PIL Image) según su tipo
        if fpath.lower().endswith(".pdf"):
            image = self._handle_pdf(fpath)
        elif fpath.lower().endswith(".xml"):
            image = self._handle_xml(fpath)
        else:
            # Asumimos que es .png / .jpg / .jpeg
            image = Image.open(fpath).convert("RGB")

        # 2. Aplicar transform si está definido
        if self.transform:
            image = self.transform(image)

        # 3. Retornar (tensor, etiqueta)
        return image, label

    def _handle_pdf(self, pdf_path):
        """
        Convierte la primera página de un PDF en una imagen PIL.
        """
        pages = convert_from_path(pdf_path, dpi=150)
        # Podemos tomar la primera página
        pil_img = pages[0].convert("RGB")
        return pil_img

    def _handle_xml(self, xml_path):
        from PIL import Image, ImageDraw, ImageFont
        
        img = Image.new("RGB", (400, 200), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        msg = "Contenido XML\n(no implementado)\n" + os.path.basename(xml_path)
        draw.text((10,10), msg, fill=(0, 0, 0))
        return img
