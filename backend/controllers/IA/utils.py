import os
from pdf2image import convert_from_path
from config import CONFIG

def convert_pdf_to_images(pdf_path):
    images = convert_from_path(pdf_path)
    return images

def convert_to_image_if_needed(pdf_path):
    images = convert_from_path(pdf_path)
    return images

def load_file(file_path):
    # Podrías usarlo para abrir un archivo y retornarlo en bytes
    with open(file_path, 'rb') as f:
        return f.read()