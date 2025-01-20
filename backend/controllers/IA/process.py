import os
import re
import pytesseract
import traceback
from PIL import Image
import json
import sys
import time
import xml.etree.ElementTree as ET

from extractions import (
    #imports use in contract
    extract_text_from_document,
    extract_text_from_pdf,
    extract_field_from_region, 
    extract_relative_field, 
    extract_field_from_xml, 
    extract_sequential_fields, 
    extract_table_data, 
    extract_signatures_from_image,
    extract_provider_fields,
    #imports use in service delivery

    #imports use in invoice
    extract_table_data_invoice,
    extract_region_text,
    process_invoice_document_with_camelot
)

from utils import (
    #imports use in contract
    convert_pdf_to_images, 
    load_document_schema,
    #imports use in service delivery

    #imports use in invoice
)

from validations import (
    #imports use in contract
    validate_order_number, 
    validate_invoice_number, 
    validate_hes_number, 
    validate_company_name, 
    validate_dates, 
    validate_contract_number, 
    validate_signatures_and_positions, 
    validate_tables_mathematics_logic, 
    validate_totals_logic,
    validate_company_direction, 
    validate_company_ruc, 
    validate_company_country, 
    validate_company_city, 
    validate_input_vs_extracted, 
    validate_provider_intro, 
    validate_client_intro, 
    validate_provider_transaction,
    validate_payment_terms_intro,
    validate_service_description_intro,
    validate_contract_details_intro,
    validate_signature_intro,
    #imports use in service delivery
    validate_signatures_and_positions_record,
    #imports use in invoice
    validate_tax_id,
    
)

# Funciones de procesamiento de documentos específicos
def process_service_delivery_record_document(file_path, schema,  ruc_input, auxiliar_input,auxiliar_hes_input, text=None, xml_tree=None):
    print("process_service_delivery_record_document")
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    required_fields = [
        "delivery_title","receiver_date","receiving_company","provider","order_number","invoice_number","hes_number","total_value","end_date","person_name","person_signature","person_position","person_company"
    ]

    validations = [
        ("receiving_company", validate_company_name),
        #("receiver_date","end_date", validate_dates),
        ("invoice_number", validate_invoice_number),
        ("hes_number", validate_hes_number),
    ]

    try:
        record_fields = schema["ServiceDeliveryRecord"]["fields"]

        if text:
            # Unir texto en una línea continua
            continuous_text = text.replace("\n", " ").strip()

            for field_name, field_info in record_fields.items():
                if "regex" in field_info:
                    try:
                        match = re.search(field_info["regex"], continuous_text)
                        if match and match.group(1):  
                            value = match.group(1).strip()

                            if field_name == "receiving_company":
                                value = "ENAP SIPETROL S.A. ENAP SIPEC" if "ENAP SIPETROL" in value else value
                            elif field_name == "provider":
                                value = value.split(".")[0].strip()

                            extracted_data[field_name] = value
                        elif field_name in required_fields:
                            missing_fields.append(field_name)
                    except IndexError as e:
                        validation_errors.append(f"Error en el campo '{field_name}': {e}")
                        missing_fields.append(field_name)

        elif xml_tree:
            for field_name, field_info in record_fields.items():
                extracted_data[field_name] = extract_field_from_xml(xml_tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)

        for field_name, validator in validations:
            if field_name in extracted_data:
                valid, error = validator(extracted_data[field_name])
                if not valid:
                    validation_errors.append(error)

        if "hes_number" in extracted_data:
            # Validar HES number y compararlo con auxiliar_hes_input
            valid, error = validate_hes_number(extracted_data["hes_number"])
            if not valid:
                validation_errors.append(error)
            elif extracted_data["hes_number"] != auxiliar_hes_input:
                validation_errors.append(
                    f"HES proporcionado ({auxiliar_hes_input}) no coincide con el extraído ({extracted_data['hes_number']})."
                )

        if "signatures" in record_fields:
            extracted_signatures, missing_signatures = validate_signatures_and_positions_record(file_path, schema, "signatures")
            extracted_data.update(extracted_signatures)
            missing_fields.extend(missing_signatures)


            if extracted_signatures:
                extracted_data["signatures"] = extracted_signatures

    except Exception as e:
        #validation_errors.append(f"Error general en el procesamiento: {str(e)}")
        print(f"Error general en el procesamiento: {str(e)}")


    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_invoice_document(file_path, schema, ruc_input, auxiliar_input, text=None, xml_tree=None):
    extracted_data = {}
    confidence_scores = {}    
    validation_errors = []
    missing_fields = []


    required_fields = [
        "company_name","company_address","company_city","company_country", "company_phone","company_website","company_email","company_tax_id","invoice_number","invoice_date","payable_at","order_number","client_name", "client_ruc", "client_address", "client_city", "client_country", "service_code", "service_description","service_quantity","service_unit_cost","service_cost","service_hes","subtotal","tax", "total_due"
    ]

    validations = [
        ("company_tax_id", validate_tax_id),
        ("", ),
        ("", ),
    ]

    fields_order = [
       {"field": "invoice_number", "pattern": r"(?i)\b(?:invoice no|factura n°)\s*[:\-]?\s*(\d+)"},
       {"field": "invoice_date", "pattern": r"(?i)\b(?:date|fecha)\s*[:\-]?\s*(\d{2}-\d{2}-\d{4})"},
       {"field": "payable_at", "pattern": r"(?i)\b(?:payable at|vencimiento)\s*[:\-]?\s*(\d{2}-\d{2}-\d{4})"},
       {"field": "order_number", "pattern": r"(?i)\b(?:order no|orden n°)\s*[:\-]?\s*(\d+)"}
    ]

    try:
        invoice_fields = schema["Invoice"]["fields"]
        if text:
            continuous_text = text.replace("\n", " ").strip()
            print("continuous text:",continuous_text)
            if "service_table" in invoice_fields:
                table_schema = invoice_fields["service_table"]
                table_data, table_errors = extract_table_data_invoice(text, table_schema)
                if table_errors:
                    validation_errors.extend(table_errors)
                else:
                    extracted_data["service_table"] = table_data
          


            for field_name, field_info in invoice_fields.items():
                if "regex" in field_info:
                    try:
                        match = re.search(field_info["regex"], continuous_text)
                        if match and match.group(1):  
                            value = match.group(1).strip() if match.groups() else None
                            extracted_data[field_name] = value
                        elif field_name in required_fields:
                            missing_fields.append(field_name)
                    except IndexError as e:
                        validation_errors.append(f"Error en el campo '{field_name}': {e}")
                        missing_fields.append(field_name)
                if "region" in field_info:
                    region = field_info["region"]
                    field_text = extract_region_text(file_path, region)
                    if not field_text or field_text.strip() == "":
                        validation_errors.append(f"No se encontró texto en la región de {field_name}.")
                else:
                    field_text = text


        elif xml_tree:
            for field_name, field_info in invoice_fields.items():
                extracted_data[field_name] = extract_field_from_xml(xml_tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)


       # Si no se logra extraer datos clave, intenta con Camelot
        if not all(key in extracted_data for key in ["invoice_number", "invoice_date", "payable_at", "order_number"]):
            camelot_result = process_invoice_document_with_camelot(file_path, schema, page_number=1)
            if "extracted_data" in camelot_result:
                extracted_data.update(camelot_result["extracted_data"])
            if "validation_errors" in camelot_result:
                validation_errors.extend(camelot_result["validation_errors"])

        # Validar campos requeridos
        for field_name, validator in validations:
            if field_name in extracted_data:
                valid, error = validator(extracted_data[field_name])
                if not valid:
                    validation_errors.append(error)

    except Exception as e:
        validation_errors.append(f"Error general en el procesamiento: {str(e)}")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields,
    }

def process_contract_document(file_path, schema, ruc_input, auxiliar_input, text=None, xml_tree=None):
    print("process_contract_document")
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    # Lista de campos requeridos
    required_fields = [
        "provider_info_intro", "provider_name", "provider_ruc", "provider_transaction",
        "provider_address", "provider_city", "provider_country", "provider_phone",
        "provider_website", "provider_email", "client_info_intro", "client_name",
        "client_ruc", "client_direction", "client_city", "client_country",
        "contract_number", "contract_order_number", "contract_invoice_number",
        "contract_hes", "contract_end_date", "first_person_name", "first_person_position",
        "second_person_name", "second_person_position","payment_terms_intro", "service_table", "contract_start_date", "service_code", "service_description", "service_hes","service_quantity", "service_unit_cost", "service_cost"
    ]

    # Cargar campos del esquema
    contract_fields = schema["Contract"]["fields"]

    if text:
    # Procesar texto extraído de PDF
        for field_name, field_info in contract_fields.items():
            if "regex" in field_info and "relative_to" not in field_info:
                match = re.search(field_info["regex"], text)
                if match:
                    try:
                        extracted_data[field_name] = match.group(1).strip()
                    except IndexError:
                        validation_errors.append(f"El grupo 1 no existe en el patrón de {field_name}")
                elif field_name in required_fields:
                    missing_fields.append(field_name)

        client_fields = {
            key: value for key, value in contract_fields.items() if key.startswith("client_")
        }
        client_data = extract_sequential_fields(text, schema, "client_info_intro", client_fields)
        extracted_data.update(client_data)

        provider_fields = {
            key: value for key, value in contract_fields.items() if key.startswith("provider_")
        }
        provider_data = extract_sequential_fields(text, schema, "provider_info_intro", provider_fields)
        extracted_data.update(provider_data)

        # Procesar tabla de servicios si existe
        if "service_table" in contract_fields:
            table_schema = contract_fields["service_table"]
            table_data, table_errors = extract_table_data(text, table_schema)
            if table_errors:
                validation_errors.extend(table_errors)
            else:
                extracted_data["service_table"] = table_data

        if "contract_start_date" in contract_fields:
            match = re.search(contract_fields["contract_start_date"]["regex"], text)
            if match:
                extracted_data["contract_start_date"] = match.group(1).strip()
            else:
                missing_fields.append("contract_start_date")
        

        if "signatures" in contract_fields:
            extracted_signatures, missing_signatures = validate_signatures_and_positions(file_path, schema, "signatures")
            extracted_data.update(extracted_signatures)
            missing_fields.extend(missing_signatures)


    elif xml_tree:
        # Procesar datos desde XML
        for field_name, field_info in contract_fields.items():
            value = extract_field_from_xml(xml_tree, field_info)
            if value:
                extracted_data[field_name] = value
            elif field_name in required_fields:
                missing_fields.append(field_name)

    # Validaciones específicas
    validations = [
        ("client_name", validate_company_name),
        ("client_direction", validate_company_direction),
        ("provider_ruc", validate_company_ruc),
        ("contract_number", validate_contract_number),
        ("client_country", validate_company_country),
        ("client_city", validate_company_city),
        ("contract_order_number", validate_order_number),
        ("contract_invoice_number", validate_invoice_number),
        ("contract_hes", validate_hes_number),
        ("provider_transaction", validate_provider_transaction),
        ("provider_info_intro", validate_provider_intro),
        ("client_info_intro", validate_client_intro),
        {"payment_terms_intro", validate_payment_terms_intro},
        {"service_description_intro", validate_service_description_intro},
        {"contract_details_intro", validate_contract_details_intro},
        {"signature_intro", validate_signature_intro},
    ]

    for field_name, validator in validations:
        if field_name in extracted_data:
            valid, error = validator(extracted_data[field_name])
            if not valid:
                validation_errors.append(error)

    # Validar RUC y Número de Contrato contra entrada del usuario
    if "client_ruc" in extracted_data:
        valid_ruc, error = validate_input_vs_extracted(ruc_input, extracted_data["provider_ruc"], "RUC")
        if not valid_ruc:
            validation_errors.append(error)

    if "contract_number" in extracted_data:
        valid_number, error = validate_input_vs_extracted(auxiliar_input, extracted_data["contract_number"], "Número de Contrato")
        if not valid_number:
            validation_errors.append(error)

    # Verificar campos requeridos faltantes
    for field in required_fields:
        if field not in extracted_data and field not in missing_fields:
            missing_fields.append(field)

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_single_document(file_path, document_type, ruc_input, auxiliar_input, auxiliar_hes_input=None):
    try:
        start_time = time.time()
        schema = load_document_schema()
        text = None
        xml_tree = None

        # Procesar el archivo según su extensión
        if file_path.endswith('.pdf'):
            text = extract_text_from_pdf(file_path)  # Extraer texto directamente del PDF
        elif file_path.endswith('.xml'):
            xml_tree = ET.parse(file_path)  # Procesar XML directamente
        elif file_path.endswith('.png'):
            text = extract_text_from_document(file_path)  # Usar OCR para PNG
        else:
            raise ValueError(f"Tipo de archivo no soportado: {file_path}")

        # Procesar según el tipo de documento
        if document_type == "Invoice":
            result = process_invoice_document(file_path, schema, ruc_input, auxiliar_input, text, xml_tree)
        elif document_type == "ServiceDeliveryRecord":
            result = process_service_delivery_record_document(file_path, schema, ruc_input, auxiliar_input, auxiliar_hes_input, text, xml_tree)
        elif document_type == "Contract":
            # No pasar auxiliar_hes_input a process_contract_document
            result = process_contract_document(file_path, schema, ruc_input, auxiliar_input, text, xml_tree)
        else:
            raise ValueError(f"Tipo de documento no soportado: {document_type}")

        # Actualizar resultado con metadatos
        result.update({
            "document_type": document_type,
            "processing_time": time.time() - start_time,
            "status": "Denegado" if result["validation_errors"] else "Aceptado",
            "ai_decision_explanation": (
                "Documento procesado correctamente"
                if not result['missing_fields'] else f"Documento denegado. Error por campos faltantes: {', '.join(result['missing_fields'])}"

                if not result["validation_errors"]
                else f"Documento denegado. Errores de validación: {', '.join(result['validation_errors'])}"
            )
        })

        return result

    except Exception as e:
        return {
            "error": str(e),
            "document_type": document_type,
            "status": "Denegado",
            "ai_decision_explanation": f"Error en el procesamiento: {str(e)}",
            "validation_errors": [str(e)]
        }

def process_single_document_safe(file_path, document_type, ruc_input, auxiliar_input, auxiliar_hes_input=None):
    try:
        # Llamar a la función original
        result = process_single_document(file_path, document_type, ruc_input, auxiliar_input, auxiliar_hes_input)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        error_output = {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "status": "Denegado",
            "ai_decision_explanation": "Error durante el procesamiento del documento"
        }
        print(json.dumps(error_output, ensure_ascii=False), file=sys.stderr)
