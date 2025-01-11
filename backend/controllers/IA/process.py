import os
import re
import pytesseract
from PIL import Image
import json
import sys
import time

from extractions import extract_field_from_region, extract_relative_field, extract_field_from_xml, extract_sequential_fields, extract_table_data, extract_section

from utils import convert_pdf_to_images, load_document_schema

from validations import validate_order_number, validate_invoice_number, validate_hes_number, validate_company_name, validate_dates, validate_contract_number, validate_signatures_and_positions, validate_tables_mathematics_logic, validate_totals_logic,validate_company_direction, validate_company_ruc, validate_company_country, validate_company_city, validate_input_vs_extracted, validate_provider_intro, validate_client_intro

# Funciones de procesamiento de documentos específicos
def process_service_delivery_record_document(images, schema, ruc_input, auxiliar_input, text=None, xml_tree=None):
    """Procesa un documento de acta de recepción y valida sus campos."""
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    try:
        if text:
            # Procesar campos definidos en el esquema
            record_fields = schema["ServiceDeliveryRecord"]["fields"]

            for field_name, field_info in record_fields.items():
                if "region" in field_info:
                    extracted_data[field_name] = extract_field_from_region(images[0],  field_info)  # Usa la primera página
                elif "regex" in field_info:
                    match = re.search(field_info["regex"], text)
                    if match:
                        extracted_data[field_name] = match.group(1).strip()
                    else:
                        missing_fields.append(field_name)

        elif xml_tree:
            # Procesar campos desde XML
            contract_fields = schema["ServiceDeliveryRecord"]["fields"]
            for field_name, field_info in contract_fields.items():
                extracted_data[field_name] = extract_field_from_xml(xml_tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)

            # TODO: Validaciones específicas
            if "order_number" in extracted_data:
                valid, error = validate_order_number(extracted_data["order_number"])
                if not valid:
                    validation_errors.append(error)

            if "invoice_number" in extracted_data:
                valid, error = validate_invoice_number(extracted_data["invoice_number"])
                if not valid:
                    validation_errors.append(error)

            if "hes_number" in extracted_data:
                valid, error = validate_hes_number(extracted_data["hes_number"])
                if not valid:
                    validation_errors.append(error)

            if "receiving_company" in extracted_data:
                valid, error = validate_company_name(extracted_data["receiving_company"])
                if not valid:
                    validation_errors.append(error)

            if "receiver_date" in extracted_data and "end_date" in extracted_data:
                valid, errors = validate_dates(extracted_data["receiver_date"], extracted_data  ["end_date"])
                if not valid:
                    validation_errors.extend(errors)

    except Exception as e:
        validation_errors.append(f"Error general en el procesamiento: {str(e)}")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_invoice_document(images, schema, ruc_input, auxiliar_input, text=None, xml_tree=None):
    extracted_data = {}
    confidence_scores = {}    
    validation_errors = []
    missing_fields = []

    try:
        if text:
            invoice_fields = schema["Invoice"]["fields"]

            if "service_table" in invoice_fields:
                table_schema = invoice_fields["service_table"]
                table_data, table_errors = extract_table_data(text, table_schema)
                if table_errors:
                    validation_errors.extend(table_errors)
                else:
                    extracted_data["service_table"] = table_data

            for field_name, field_info in invoice_fields.items():
                if "region" in field_info:
                    extracted_data[field_name] = extract_field_from_region(images[0], field_info)
                elif "relative_to" in field_info:
                    extracted_data[field_name] = extract_relative_field(images[0], extracted_data, field_info)
                elif "regex" in field_info:
                    match = re.search(field_info["regex"], text)
                    if match:
                        extracted_data[field_name] = match.group(1).strip()
                    else:
                        missing_fields.append(field_name)

        elif xml_tree:
            # Procesar campos desde XML
            contract_fields = schema["Invoice"]["fields"]
            for field_name, field_info in contract_fields.items():
                extracted_data[field_name] = extract_field_from_xml(xml_tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)


        # TODO: Validar campos específicos
        if "service_table" in extracted_data:
            table_data = extracted_data["service_table"]  
            valid, errors = validate_tables_mathematics_logic(table_data)
            if not valid:
                validation_errors.extend(errors)

        if "company_name" in extracted_data:
            valid, error = validate_company_name(extracted_data["company_name"])
            if not valid:
                validation_errors.append(error)

        if "client_ruc" in extracted_data:
            valid, error = validate_company_ruc(extracted_data["client_ruc"])
            if not valid:
                validation_errors.append(error)
            print(ruc_input)
            validRuc, error = validate_input_vs_extracted(ruc_input, extracted_data["client_ruc"], "RUC")
            if not validRuc:
                validation_errors.append(error)

        if "invoice_date" in extracted_data and "payable_at" in extracted_data:
            valid, error = validate_dates(extracted_data["invoice_date"], extracted_data["payable_at"])
            if not valid:
                validation_errors.append(error)

        if "invoice_number" in extracted_data:
            valid, error = validate_invoice_number(extracted_data["invoice_number"])
            if not valid:
                validation_errors.append(error)

        if "order_number" in extracted_data:
                valid, error = validate_hes_number(extracted_data["order_number"])
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

def process_contract_document(images, schema, ruc_input, auxiliar_input, text=None, xml_tree=None):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    try:
        if text:
            # Procesar texto extraído con OCR
            contract_fields = schema["Contract"]["fields"]

            if "service_table" in contract_fields:
                table_schema = contract_fields["service_table"]
                table_data, table_errors = extract_table_data(text, table_schema)
                if table_errors:
                    validation_errors.extend(table_errors)
                else:
                    extracted_data["service_table"] = table_data


            # Extraer campos secuenciales
            client_fields = {
                key: value for key, value in contract_fields.items()
                if key.startswith("client_")
            }
            extracted_data.update(
                extract_sequential_fields(text, contract_fields, "client_name", client_fields)
            )

            # Procesar campos individuales y relativos
            for field_name, field_info in contract_fields.items():
                if field_name in extracted_data:  # Evitar procesar duplicados
                    continue
                if "region" in field_info:
                    extracted_data[field_name] = extract_field_from_region(images[0], field_info)  # Usa la primera página
                elif "relative_to" in field_info:
                    extracted_data[field_name] = extract_relative_field(images[0], extracted_data, field_info)
                elif "regex" in field_info:
                    match = re.search(field_info["regex"], text)
                    if match:
                        extracted_data[field_name] = match.group(1).strip()
                    else:
                        missing_fields.append(field_name)

        elif xml_tree:
            # Procesar campos desde XML
            contract_fields = schema["Contract"]["fields"]
            for field_name, field_info in contract_fields.items():
                extracted_data[field_name] = extract_field_from_xml(xml_tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)

        if "client_name" in extracted_data:
            valid, error = validate_company_name(extracted_data["client_name"])
            if not valid:
                validation_errors.append(error)
                print(f"Validation Error for 'client_name': {error}")
        
        if "client_direction" in extracted_data:
            valid, error = validate_company_direction(extracted_data["client_direction"])
            if not valid:
                validation_errors.append(error)
                print(f"Validation Error for 'client_direction': {error}")

        if "client_ruc" in extracted_data:
            valid, error = validate_company_ruc(extracted_data["client_ruc"])
            if not valid:
                validation_errors.append(error)
            print(ruc_input)
            validRuc, error = validate_input_vs_extracted(ruc_input, extracted_data["client_ruc"], "RUC")
            if not validRuc:
                validation_errors.append(error)

        if "contract_number" in extracted_data:
            valid, error = validate_contract_number(extracted_data["contract_number"])
            if not valid:
                validation_errors.append(error)
            print(auxiliar_input)
            validNumber, error = validate_input_vs_extracted(auxiliar_input, extracted_data["contract_number"], "Número de Contrato")
            if not validNumber:
                validation_errors.append(error)

        if "client_country" in extracted_data:
            valid, error = validate_company_country(extracted_data["client_country"])
            if not valid:
                validation_errors.append(error)

        if "client_city" in extracted_data:
            valid, error = validate_company_city(extracted_data["client_city"])
            if not valid:
                validation_errors.append(error)

        if "contract_order_number" in extracted_data:
            valid, error = validate_order_number(extracted_data["contract_order_number"])
            if not valid:
                validation_errors.append(error)

        if "contract_invoice_number" in extracted_data:
            valid, error = validate_invoice_number(extracted_data["contract_invoice_number"])
            if not valid:
                validation_errors.append(error)

        if "contract_hes" in extracted_data:
            valid, error = validate_hes_number(extracted_data["contract_hes"])
            if not valid:
                validation_errors.append(error)

        if "service_table" in extracted_data:
            table_data = extracted_data["service_table"]  
            valid, errors = validate_tables_mathematics_logic(table_data)
            if not valid:
                validation_errors.extend(errors)

        if {"subtotal", "tax_rate", "tax_amount", "total_due"} <= extracted_data.keys():
            valid_totals, totals_errors = validate_totals_logic(extracted_data, table_data)
            if not valid_totals:
                validation_errors.extend(totals_errors)

        if "signatures" in contract_fields:
            signature_text = extract_section(text, "Firmas", "Fecha")
            for field, info in contract_fields["signatures"]["fields"].items():
                if "regex" in info:
                    match = re.search(info["regex"], signature_text)
                    extracted_data[field] = match.group(0) if match else None
                    if not match:
                        missing_fields.append(field)
                        validation_errors.extend(errors)

        if "provider_info_intro" in extracted_data:
            provider_intro = extracted_data["provider_info_intro"]
            valid, errors = validate_provider_intro(provider_intro)
            if not valid:
                validation_errors.extend(errors)
                missing_fields.append("provider_info_intro")

        if "client_info_intro" in extracted_data:
            client_intro = extracted_data["client_info_intro"]
            valid, errors = validate_client_intro(client_intro)
            if not valid:
                validation_errors.extend(errors)
                missing_fields.append("client_info_intro")

    except Exception as e:
        validation_errors.append(f"Error general en el procesamiento: {str(e)}")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_single_document(file_path, document_type, ruc_input, auxiliar_input):
    try:
        start_time = time.time()
        schema = load_document_schema()

        if file_path.endswith('.pdf'):
            images = convert_pdf_to_images(file_path)
            text = "".join(pytesseract.image_to_string(image, lang='spa') for image in images)
            xml_tree = None
        elif file_path.endswith('.xml'):
            import xml.etree.ElementTree as ET
            xml_tree = ET.parse(file_path)
            text = None
        else:
            image = Image.open(file_path).convert('RGB')
            text = pytesseract.image_to_string(image, lang='spa')
            xml_tree = None

        if document_type == "Invoice":
            result = process_invoice_document(file_path, schema, text, xml_tree)
        elif document_type == "ServiceDeliveryRecord":
            result = process_service_delivery_record_document(file_path, schema, text, xml_tree)
        elif document_type == "Contract":
            result = process_contract_document(file_path, schema,ruc_input, auxiliar_input, text, xml_tree)
            """ TODO: DELETE
            result = process_contract_document(file_path, schema, text, xml_tree)
            """
        else:
            raise ValueError(f"Tipo de documento no soportado: {document_type}")

        result.update({
            "document_type": document_type,
            "processing_time": time.time() - start_time,
            "status": "Denegado" if result["validation_errors"] else "Aceptado",
            "ai_decision_explanation": (
                "Documento procesado correctamente"
                if not result["validation_errors"]
                else f"Documento denegado. Errores: {', '.join(result['validation_errors'])}"
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


