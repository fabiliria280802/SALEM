import re
import pytesseract
from PIL import Image
def extract_field_from_region(image, field_info):
    if "region" in field_info:
        region = field_info["region"]
        cropped_image = image.crop((
            region["left"],
            region["top"],
            region["left"] + region["width"],
            region["top"] + region["height"]
        ))
        text = pytesseract.image_to_string(cropped_image, lang="eng").strip()
        text = text.replace('\n', ' ').strip() 
        text = re.sub(r'\s+', ' ', text) 
        return text
    return None

def extract_sequential_fields(text, schema, start_field, field_relations):
    """
    Extrae campos secuenciales a partir de un campo inicial, siguiendo las relaciones definidas.
    """
    extracted_data = {}
    current_field = start_field

    while current_field:
        field_info = field_relations.get(current_field)
        if not field_info:
            break  # No hay más relaciones

        regex = field_info.get("regex")
        if not regex:
            break  # El campo no tiene regex definido

        # Buscar el texto a partir de la posición del campo actual
        if current_field in extracted_data:
            start_position = text.find(extracted_data[current_field]) + len(extracted_data[current_field])
        else:
            start_position = 0

        match = re.search(regex, text[start_position:])
        if match:
            extracted_data[current_field] = match.group(1).strip()
        else:
            print(f"No se encontró el campo {current_field} en la secuencia.")
            break  # Termina si no encuentra el campo actual

        # Pasar al siguiente campo
        current_field = next((k for k, v in field_relations.items() if v.get("relative_to") == current_field), None)

    return extracted_data

def extract_relative_field(image, base_field, field_info):
    if "relative_to" in field_info and "offset" in field_info:
        base_region = field_info["relative_to"]["region"]
        offset = field_info["offset"]
        region = {
            "left": base_region["left"] + offset["x"],
            "top": base_region["top"] + offset["y"],
            "width": base_region["width"],
            "height": base_region["height"]
        }
        cropped_image = image.crop((
            region["left"],
            region["top"],
            region["left"] + region["width"],
            region["top"] + region["height"]
        ))
        text = pytesseract.image_to_string(cropped_image, lang="eng").strip()
        text = text.replace('\n', ' ').strip() 
        text = re.sub(r'\s+', ' ', text) 
        return text
    return None

def extract_field_from_xml(xml_tree, field_info):
    xpath_query = field_info.get("xpath")
    if xpath_query:
        element = xml_tree.find(xpath_query)
        return element.text if element is not None else None
    return None

def extract_table_data(text, table_schema):
    """
    Extrae datos de una tabla en el texto basado en un esquema.
    """
    table_data = []
    lines = text.split("\n")
    
    # Localizar encabezado de la tabla
    header_found = False
    for i, line in enumerate(lines):
        if all(col["label"] in line for col in table_schema["columns"].values()):
            header_found = True
            start_row = i + 1
            break
    
    if not header_found:
        return table_data, ["No se encontró el encabezado de la tabla."]
    
    # Procesar las filas de la tabla
    for line in lines[start_row:]:
        if line.strip() == "":
            break  # Fin de la tabla
        row = {}
        row_data = re.split(r"\s*\|\s*", line.strip("|"))
        
        if len(row_data) != len(table_schema["columns"]):
            continue  # Ignorar filas mal formateadas

        for col_name, col_info in table_schema["columns"].items():
            match = re.match(col_info["regex"], row_data.pop(0))
            if match:
                row[col_name] = match.group(0)
            else:
                row[col_name] = None
        table_data.append(row)
    
    return table_data, []

def extract_text_from_document(file_path):
    """Extrae texto de un documento utilizando Tesseract."""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image, lang="eng")
        text = text.replace('\n', ' ').strip() 
        text = re.sub(r'\s+', ' ', text) 
        return text
    except Exception as e:
        raise ValueError(f"Error al extraer texto del documento {file_path}: {e}")

def extract_section(text, start_marker, end_marker=None):
    start_idx = text.find(start_marker)
    end_idx = text.find(end_marker, start_idx) if end_marker else len(text)
    return text[start_idx:end_idx]

def extract_tax_id(image_path):
    image = Image.open(image_path)
    cropped_image = image.crop((72, 150, 200, 160))  # Usar coordenadas detectadas
    text = pytesseract.image_to_string(cropped_image, lang="eng")
    return text.strip()