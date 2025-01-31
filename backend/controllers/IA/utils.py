import os
import json
import fitz
from PIL import Image

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
