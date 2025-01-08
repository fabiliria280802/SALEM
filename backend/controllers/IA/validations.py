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

def validate_contract_number(contract_number):
    """Valida que el número contract inicie con '65' y tenga 6 cifras más"""
    if re.fullmatch(r"65\d{5}",contract_number):
        return True, None
    return False, f"contract_number '{contract_number}' no cumple con el formato."

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

def validate_tables_mathematics_logic(table_data):
    """
    Valida la lógica matemática de la tabla de servicios.

    Args:
        table_data (list[dict]): Lista de filas de la tabla extraídas.

    Returns:
        tuple: (valid (bool), errors (list[str]))
               - valid: True si toda la tabla es válida, False si hay errores.
               - errors: Lista de errores encontrados, con detalles de las filas incorrectas.
    """
    valid = True
    errors = []

    for idx, row in enumerate(table_data):
        try:
            # Extraer valores relevantes
            quantity = float(row.get("service_quantity", 0))
            unit_cost = float(row.get("service_unit_cost", 0))
            total_cost = float(row.get("service_cost", 0))

            # Validar la lógica matemática
            expected_total = round(quantity * unit_cost, 2)
            if total_cost != expected_total:
                valid = False
                errors.append(
                    f"Error en la fila {idx + 1}: Total esperado ({expected_total}) "
                    f"no coincide con el total calculado ({total_cost})."
                )
        except (ValueError, TypeError) as e:
            valid = False
            errors.append(f"Error en la fila {idx + 1}: {str(e)}")

    return valid, errors

def validate_totals_logic(extracted_data, table_data):
    """
    Valida la lógica numérica de los totales: subtotal, tax_amount y total_due.

    Args:
        extracted_data (dict): Datos extraídos del documento que incluyen subtotal, tax_rate, tax_amount, y total_due.
        table_data (list[dict]): Datos de la tabla extraída (filas con costos totales).

    Returns:
        tuple: (valid (bool), errors (list[str]))
               - valid: True si todos los cálculos son válidos, False si hay errores.
               - errors: Lista de errores encontrados, con detalles específicos.
    """
    valid = True
    errors = []

    try:
        # Calcular el subtotal a partir de los costos totales de la tabla
        calculated_subtotal = sum(float(row.get("service_cost", 0)) for row in table_data)
        extracted_subtotal = float(extracted_data.get("subtotal", 0))

        if round(calculated_subtotal, 2) != round(extracted_subtotal, 2):
            valid = False
            errors.append(
                f"Error en el subtotal: Subtotal calculado ({calculated_subtotal:.2f}) "
                f"no coincide con el extraído ({extracted_subtotal:.2f})."
            )

        # Validar la tasa de impuesto (tax_rate)
        tax_rate = float(extracted_data.get("tax_rate", 0))
        expected_tax_rate = 15.0  # La tasa de impuesto esperada
        if round(tax_rate, 2) != expected_tax_rate:
            valid = False
            errors.append(
                f"Error en la tasa de impuesto: Se esperaba {expected_tax_rate}%, "
                f"pero se encontró {tax_rate:.2f}%."
            )

        # Validar el monto de impuesto (tax_amount)
        calculated_tax_amount = round(calculated_subtotal * (expected_tax_rate / 100), 2)
        extracted_tax_amount = float(extracted_data.get("tax_amount", 0))

        if round(calculated_tax_amount, 2) != round(extracted_tax_amount, 2):
            valid = False
            errors.append(
                f"Error en el monto de impuesto: Tax Amount calculado ({calculated_tax_amount:.2f}) "
                f"no coincide con el extraído ({extracted_tax_amount:.2f})."
            )

        # Validar el total a pagar (total_due)
        calculated_total_due = round(calculated_subtotal + calculated_tax_amount, 2)
        extracted_total_due = float(extracted_data.get("total_due", 0))

        if round(calculated_total_due, 2) != round(extracted_total_due, 2):
            valid = False
            errors.append(
                f"Error en el total a pagar: Total calculado ({calculated_total_due:.2f}) "
                f"no coincide con el extraído ({extracted_total_due:.2f})."
            )

    except (ValueError, TypeError) as e:
        valid = False
        errors.append(f"Error en la validación de totales: {str(e)}")

    return valid, errors

def validate_signatures_and_positions(document_path, schema, field_key):
    text = extract_text_from_document(document_path)  # Extrae texto del documento
    extracted_data = {}
    missing_fields = []

    # Validar nombres, posiciones y empresa
    for field, info in schema[field_key]["fields"].items():
        if "regex" in info:  # Validar con regex
            match = re.search(info["regex"], text)
            if match:
                extracted_data[field] = match.group(0).strip()
            else:
                missing_fields.append(field)
        elif "values" in info:  # Validar posiciones con valores predefinidos
            match = re.search(r"\b(" + "|".join(map(re.escape, info["values"])) + r")\b", text, re.IGNORECASE)
            if match:
                extracted_data[field] = match.group(0).strip()
            else:
                missing_fields.append(field)

    # Verificar imágenes de firmas
    if document_path.endswith(".pdf"):
        images = convert_pdf_to_images(document_path)
        for idx, field in enumerate(["first_person_signature", "second_person_signature"]):
            if not verify_signature_in_image(images[-1], idx):
                missing_fields.append(field)

    return extracted_data, missing_fields

def verify_signature_in_image(image, position_index):
    # Define las regiones donde se esperan las firmas
    signature_regions = [
        (50, 700, 400, 750),  # Coordenadas de la primera firma
        (450, 700, 800, 750)  # Coordenadas de la segunda firma
    ]

    try:
        region = signature_regions[position_index]
        cropped_region = image.crop(region)
        # Verifica si hay contenido en la región recortada
        return cropped_region.getbbox() is not None
    except IndexError:
        return False  # Manejar errores de índice si no hay más regiones definidas

