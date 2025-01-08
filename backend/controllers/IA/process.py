import os
import re
import pytesseract
from PIL import Image
import json
import sys
import time

from extractions import extract_field_from_region, extract_relative_field, extract_field_from_xml, extract_sequential_fields, extract_table_data
from utils import convert_pdf_to_images, load_document_schema
from validations import validate_order_number, validate_invoice_number, validate_hes_number, validate_company_name, validate_dates

# Funciones de procesamiento de documentos específicos
def process_service_delivery_record_document(file_path, schema):
    """Procesa un documento de acta de recepción y valida sus campos."""
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    try:
        # Determinar el tipo de archivo
        if file_path.endswith(".pdf"):
            images = convert_pdf_to_images(file_path)  # Todas las páginas del PDF
            source = "image"
            text = ""
            for image in images:
                page_text = pytesseract.image_to_string(image, lang="eng")
                text += page_text + "\n"
        elif file_path.endswith(".png"):
            image = Image.open(file_path).convert('RGB')
            source = "image"
            text = pytesseract.image_to_string(image, lang="eng")
            images = [image]
        elif file_path.endswith(".xml"):
            import xml.etree.ElementTree as ET
            tree = ET.parse(file_path)
            source = "xml"
        else:
            raise ValueError("Formato de archivo no soportado")

        # Procesar campos definidos en el esquema
        record_fields = schema["ServiceDeliveryRecord"]["fields"]

        if source == "image":
            for field_name, field_info in record_fields.items():
                if "region" in field_info:
                    extracted_data[field_name] = extract_field_from_region(images[0], field_info)  # Usa la primera página
                elif "regex" in field_info:
                    match = re.search(field_info["regex"], text)
                    if match:
                        extracted_data[field_name] = match.group(1).strip()
                    else:
                        missing_fields.append(field_name)

        elif source == "xml":
            for field_name, field_info in record_fields.items():
                extracted_data[field_name] = extract_field_from_xml(tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)

        # Validaciones específicas
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
            valid, errors = validate_dates(extracted_data["receiver_date"], extracted_data["end_date"])
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

def process_invoice_document(file_path, schema):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    try:
        # Determina el tipo de archivo
        if file_path.endswith(".pdf") or file_path.endswith(".png"):
            image = convert_pdf_to_images(file_path)[0]  # Primera página
            source = "image"
        elif file_path.endswith(".xml"):
            import xml.etree.ElementTree as ET
            tree = ET.parse(file_path)
            source = "xml"
        else:
            raise ValueError("Formato de archivo no soportado")

        # Iterar sobre los campos definidos en el esquema
        for field_name, field_info in schema["Invoice"]["fields"].items():
            try:
                if source == "image":
                    if "region" in field_info:
                        extracted_data[field_name] = extract_field_from_region(image, field_info)
                    elif "relative_to" in field_info:
                        extracted_data[field_name] = extract_relative_field(image, extracted_data, field_info)
                elif source == "xml":
                    extracted_data[field_name] = extract_field_from_xml(tree, field_info)

                # Validar si el campo no fue extraído
                if not extracted_data.get(field_name):
                    missing_fields.append(field_name)
            except Exception as e:
                validation_errors.append(f"Error en {field_name}: {str(e)}")

        # Validar campos esenciales (como invoice_number)
        if "invoice_number" in extracted_data:
            valid, error = validate_invoice_number(extracted_data["invoice_number"])
            if not valid:
                validation_errors.append(error)

    except Exception as e:
        validation_errors.append(f"Error general en el procesamiento: {str(e)}")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_contract_document(file_path, schema):
    extracted_data = {}
    confidence_scores = {}
    validation_errors = []
    missing_fields = []

    try:
        # Determina el tipo de archivo
        if file_path.endswith(".pdf"):
            images = convert_pdf_to_images(file_path)  # Todas las páginas del PDF
            source = "image"
        elif file_path.endswith(".xml"):
            import xml.etree.ElementTree as ET
            tree = ET.parse(file_path)
            source = "xml"
        else:
            raise ValueError("Formato de archivo no soportado")

        # Extraer y procesar campos según el tipo de archivo
        contract_fields = schema["Contract"]["fields"]

        if source == "image":
            text = ""
            # Combinar texto de todas las páginas del PDF
            for image in images:
                page_text = pytesseract.image_to_string(image, lang="eng")
                text += page_text + "\n"

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

        elif source == "xml":
            for field_name, field_info in contract_fields.items():
                extracted_data[field_name] = extract_field_from_xml(tree, field_info)
                if not extracted_data[field_name]:
                    missing_fields.append(field_name)

        # Procesar la tabla de servicios
        try:
            table_schema = contract_fields.get("service_table")
            if table_schema and source == "image":
                table_data, table_errors = extract_table_data(text, table_schema)
                extracted_data["service_table"] = table_data
                if table_errors:
                    validation_errors.extend(table_errors)
            elif table_schema and source == "xml":
                # Procesa la tabla desde XML si está disponible
                extracted_data["service_table"] = extract_field_from_xml(tree, table_schema)
        except Exception as e:
            validation_errors.append(f"Error procesando tabla de servicios: {str(e)}")

    except Exception as e:
        validation_errors.append(f"Error general en el procesamiento: {str(e)}")

    return {
        "extracted_data": extracted_data,
        "confidence_scores": confidence_scores,
        "validation_errors": validation_errors,
        "missing_fields": missing_fields
    }

def process_single_document(file_path, document_type):
    try:
        start_time = time.time()
        schema = load_document_schema()

        if file_path.endswith('.pdf'):
            image = convert_pdf_to_images(file_path)[0]
        elif file_path.endswith('.xml'):
            import xml.etree.ElementTree as ET
            xml_tree = ET.parse(file_path)
        else:
            image = Image.open(file_path).convert('RGB')

        # Extraer texto según el idioma
        text = None
        if not file_path.endswith('.xml'):
            try:
                text = pytesseract.image_to_string(image, lang='spa')
            except:
                print("Advertencia: No se pudo usar español, usando inglés.", file=sys.stderr)
                text = pytesseract.image_to_string(image, lang='eng')

        # Procesamiento según el tipo de documento
        if document_type == "Invoice":
            result = process_invoice_document(image, schema, text, xml_tree if file_path.endswith('.xml') else None)
        elif document_type == "ServiceDeliveryRecord":
            result = process_service_delivery_record_document(image, schema, text, xml_tree if file_path.endswith('.xml') else None)
        elif document_type == "Contract":
            result = process_contract_document(image, schema, text, xml_tree if file_path.endswith('.xml') else None)
        else:
            raise ValueError(f"Tipo de documento no soportado: {document_type}")

        # Actualización de resultados
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

        # Salida JSON
        result_json = json.dumps(result, ensure_ascii=False)
        print(result_json, flush=True)
        return result

    except Exception as e:
        error_result = {
            "error": str(e),
            "document_type": document_type,
            "status": "Denegado",
            "ai_decision_explanation": f"Error en el procesamiento: {str(e)}",
            "validation_errors": [str(e)]
        }
        print(f"Error en process_single_document: {str(e)}", file=sys.stderr)
        print(json.dumps(error_result), flush=True)
        return error_result

