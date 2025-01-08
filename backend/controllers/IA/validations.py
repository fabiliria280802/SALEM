import re
from datetime import datetime

from utils import convert_pdf_to_images
from extractions import extract_text_from_document

def validate_order_number(order_number):
    """Valida que el número de orden inicie con '34' y tenga 5 cifras más."""
    if re.fullmatch(r"34\d{5}", order_number):
        return True, None
    return False, f"order_number '{order_number}' no cumple con el formato."

def validate_invoice_number(invoice_number):
    """Valida que el número de factura inicie con '11' y tenga 5 cifras más."""
    if re.fullmatch(r"11\d{5}", invoice_number):
        return True, None
    return False, f"invoice_number '{invoice_number}' no cumple con el formato."

def validate_hes_number(hes_number):
    """Valida que el número HES inicie con '812' y tenga 5 cifras más."""
    if re.fullmatch(r"812\d{5}", hes_number):
        return True, None
    return False, f"hes_number '{hes_number}' no cumple con el formato."

def validate_company_name(company_name):
    """Valida que el nombre de la empresa sea exactamente 'ENAP SIPETROL S.A. ENAP SIPEC'."""
    expected_name = "ENAP SIPETROL S.A. ENAP SIPEC"
    if company_name.strip() == expected_name:
        return True, None
    return False, f"company_name '{company_name}' no coincide con '{expected_name}'."

def validate_dates(receiver_date, end_date):
    """Valida que las fechas estén en formato correcto y sean cronológicamente coherentes."""
    errors = []
    date_format = "%d/%m/%Y"
    
    try:
        receiver_date_obj = datetime.strptime(receiver_date, date_format)
    except ValueError:
        errors.append(f"receiver_date '{receiver_date}' no tiene el formato correcto ({date_format}).")
        receiver_date_obj = None
    
    try:
        end_date_obj = datetime.strptime(end_date, date_format)
    except ValueError:
        errors.append(f"end_date '{end_date}' no tiene el formato correcto ({date_format}).")
        end_date_obj = None
    
    if receiver_date_obj and end_date_obj:
        if end_date_obj < receiver_date_obj:
            errors.append("end_date no puede ser anterior a receiver_date.")
    
    return len(errors) == 0, errors

def validate_signatures_and_positions(document_path, schema, field_key):
    text = extract_text_from_document(document_path)
    extracted_data = {}
    missing_fields = []

    # Validar nombres, posiciones y empresa
    for field, info in schema[field_key]["fields"].items():
        if "regex" in info:
            match = re.search(info["regex"], text)
            if match:
                extracted_data[field] = match.group(0)
            else:
                missing_fields.append(field)
        elif "values" in info:  # Validar posiciones en base a lista
            match = re.search(r"\b" + r"\b|\b".join(info["values"]) + r"\b", text)
            if match:
                extracted_data[field] = match.group(0)
            else:
                missing_fields.append(field)

    # Verificar imágenes de firmas
    if document_path.endswith(".pdf"):
        images = convert_pdf_to_images(document_path)
        for idx, field in enumerate(["person_signature"]):  # Cambiar si hay múltiples firmas
            if not verify_signature_in_image(images[-1], idx):
                missing_fields.append(field)

    return extracted_data, missing_fields

def verify_signature_in_image(image, position_index):
    signature_regions = [
        (50, 700, 400, 750),  
        (450, 700, 800, 750) 
    ]
    region = signature_regions[position_index]
    cropped_region = image.crop(region)
    return not cropped_region.getbbox() is None 
