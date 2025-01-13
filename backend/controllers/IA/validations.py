import re
from datetime import datetime
from PIL import ImageOps, ImageChops, Image

from utils import convert_pdf_to_images
from extractions import extract_text_from_document, extract_section, extract_images_from_pdf, extract_text_near_signature

# Contract
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

def validate_company_direction(company_direction):
    """Valida que la dirección de la empresa sea exactamente 'AV. GRANADOS VIA A NAYON EDIFICIO EKOPARK OFICINA 3 PISO 3'."""
    expected_direction = "AV. GRANADOS VIA A NAYON EDIFICIO EKOPARK OFICINA 3 PISO 3"
    if company_direction.strip() == expected_direction:
        return True, None
    return False, f"company_direction '{company_direction}' no coincide con '{expected_direction}'."

def validate_company_city(company_city):
    """Valida que la ciudad de la empresa sea exactamente 'Quito'."""
    expected_city= "Quito"
    if company_city.strip() == expected_city:
        return True, None
    return False, f"company_city '{company_city}' no coincide con '{expected_city}'."

def validate_company_country(company_country):
    expected_country= "Ecuador"
    if company_country.strip() == expected_country:
        return True, f"company_country '{company_country}' no coincide con '{expected_country}'."
    return False, None
    
def validate_company_ruc(company_ruc):
    if not company_ruc.isdigit() or len(company_ruc) != 13:
        return False, f"El ruc es '{company_ruc}' no es válido"
    return True, None

def validate_input_vs_extracted(input_value, extracted_value, field_name):
    if input_value.strip() != extracted_value.strip():
        return False, f"El valor ingresado para '{field_name}' ('{input_value}') no coincide con el valor extraído ('{extracted_value}')."
    return True, None

def validate_company_name(company_name):
    """Valida que el nombre de la empresa sea exactamente 'ENAP SIPETROL S.A. ENAP SIPEC'."""
    expected_name = "ENAP SIPETROL S.A. ENAP SIPEC"
    if company_name.strip() == expected_name:
        return True, None
    return False, f"company_name '{company_name}' no coincide con '{expected_name}'."

def validate_dates(receiver_date, end_date):
    """Valida que las fechas estén en formato correcto y sean cronológicamente coherentes."""
    errors = []
    date_format = "%dd/%mm/%YYYY"
    
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
    valid = True
    errors = []

    for idx, row in enumerate(table_data):
        try:
            # Extraer valores relevantes
            quantity = float(row.get("service_quantity") or 0)
            unit_cost = float(row.get("service_unit_cost") or 0)
            total_cost = float(row.get("service_cost") or 0)

            # Validar la lógica matemática
            expected_total = round(quantity * unit_cost, 2)
            if total_cost and total_cost != expected_total:
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
    extracted_data = {}
    missing_fields = []

    try:
        images = extract_images_from_pdf(document_path)
    except Exception as e:
        return {}, [f"Error extrayendo imágenes del PDF: {e}"]

    # Acceder correctamente al campo "signatures"
    signature_fields = schema["Contract"]["fields"]["signatures"]["fields"]

    for idx, signature_field in enumerate(["first_person_signature", "second_person_signature"]):
        if idx < len(images):
            # Verificar si hay una firma presente en la región
            if verify_signature_in_image(images[idx]["image"], idx):
                extracted_data[signature_field] = f"Firma detectada en página {images[idx]['page']} imagen {images[idx]['index']}"
                text_near_signature = extract_text_near_signature(images[idx]["image"], idx)
                if text_near_signature:
                    # Validar y extraer nombre y posición
                    name_field = "first_person_name" if idx == 0 else "second_person_name"
                    position_field = "first_person_position" if idx == 0 else "second_person_position"

                    # Validar nombre
                    match = re.search(signature_fields[name_field]["regex"], text_near_signature)
                    if match:
                        extracted_data[name_field] = match.group(0).strip()
                    else:
                        missing_fields.append(name_field)

                    # Validar posición
                    valid_positions = signature_fields[position_field]["values"]
                    position_match = re.search(r"\b(" + "|".join(map(re.escape, valid_positions)) + r")\b", text_near_signature, re.IGNORECASE)
                    if position_match:
                        extracted_data[position_field] = position_match.group(0).strip()
                    else:
                        missing_fields.append(position_field)
            else:
                missing_fields.append(signature_field)
        else:
            missing_fields.append(signature_field)

    return extracted_data, missing_fields

def verify_signature_in_image(image, position_index):
    """
    Verifica si una firma está presente en una región específica de la imagen.
    """
    signature_regions = [
        (50, 600, 450, 900),  # Primera firma y texto relacionado (ampliada hacia arriba y abajo)
        (500, 600, 850, 900)  # Segunda firma y texto relacionado (ampliada hacia arriba y abajo)
    ]

    try:
        region = signature_regions[position_index]
        cropped_region = image.crop(region)
        gray_region = ImageOps.grayscale(cropped_region)
        if ImageChops.difference(gray_region, Image.new("L", gray_region.size, 255)).getbbox():
            return True
    except Exception as e:
        print(f"Error al verificar la firma en la posición {position_index}: {str(e)}")
    return False

def validate_provider_intro(provider_info_intro):
    expected_intro = "Información de la Compañía"
    expected_intro_english = "Company Information"
    if provider_info_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"provider_info_intro '{provider_info_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_client_intro(client_info_intro):
    expected_intro = "Información del Cliente"
    expected_intro_english = "Client Information"
    if client_info_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"client_info_intro '{client_info_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_payment_terms_intro(payment_terms_intro):
    expected_intro = "Condiciones de Pago"
    expected_intro_english = "Payment Terms"
    if payment_terms_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"payment_terms_intro '{payment_terms_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_service_description_intro(service_description_intro):
    expected_intro = "Descripción de Servicios e Items"
    expected_intro_english = "Description of Services & Items"
    if service_description_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"service_description_intro '{service_description_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_contract_details_intro(contract_details_intro):
    expected_intro = "Detalles del Contrato"
    expected_intro_english = "Contract Details"
    if contract_details_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"contract_details_intro '{contract_details_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_signature_intro(signature_intro):
    expected_intro = "Firmas"
    expected_intro_english = "Signatures"
    if signature_intro.strip().lower() in {expected_intro.lower(), expected_intro_english.lower()}:
        return True, None
    
    return False, f"signature_intro '{signature_intro}' no coincide con '{expected_intro}' ni con '{expected_intro_english}'."

def validate_provider_transaction(provider_transaction):
    if not provider_transaction.isdigit() or len(provider_transaction) != 8:
        return False, f"El Tax ID '{provider_transaction}' no es válido"
    return True, None

# Services delivery record