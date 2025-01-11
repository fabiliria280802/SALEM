import pytesseract
import re
import xml.etree.ElementTree as ET
from utils import convert_to_image_if_needed

def extract_text_from_image(image_path):
    text = pytesseract.image_to_string(image_path, lang='spa+eng')
    return text

def extract_text_from_pdf(pdf_path):
    images = convert_to_image_if_needed(pdf_path)
    extracted_text = []
    for img in images:
        page_text = pytesseract.image_to_string(img, lang='spa+eng')
        extracted_text.append(page_text)
    return " ".join(extracted_text)

def extract_service_table(text, columns_config):
    """
    Ejemplo minimalista para 'service_table'. 
    La idea es buscar filas y extraer, p.ej., 
    'service_code', 'service_description', 'service_quantity', etc.
    """
    # Aquí la lógica real depende de cómo venga representada la tabla en 'text'.
    # Por ejemplo, si cada fila es algo como:
    #   CODE | DESCRIPTION | QTY | UNIT | COST
    #   ABC1   "ServicioX"   10    4.50   45.00
    # Podrías partir las líneas y aplicar las regex definidas en columns_config.
    # Ejemplo simplificado:
    lines = text.split('\n')
    table_rows = []
    for line in lines:
        # Revisamos si la línea parece contener data
        # Este es un pseudo-ejemplo, ajusta a tu realidad.
        if "service" in line.lower():
            row_data = {}
            for col_key, col_cfg in columns_config.items():
                col_match = re.search(col_cfg["regex"], line)
                if col_match:
                    row_data[col_key] = col_match.group(0)
                else:
                    row_data[col_key] = None
            table_rows.append(row_data)
    return table_rows

def extract_data_from_xml(xml_path):
    # Parseo básico de XML
    tree = ET.parse(xml_path)
    root = tree.getroot()
    # Retorna un dict con la info clave
    data = {}
    # Iterar sobre nodos relevantes, por ejemplo:
    for child in root:
        data[child.tag] = child.text
    return data

def find_specific_fields(text, regex_pattern):
    # Aplica una expresión regular para buscar campos
    match = re.search(regex_pattern, text)
    if match:
        return match.group(1)
    return None
