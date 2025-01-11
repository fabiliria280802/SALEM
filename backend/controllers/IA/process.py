
import os
import re

from extractions import extract_text_from_pdf, extract_text_from_image, extract_data_from_xml, extract_service_table
from validations import validate_service_delivery_record_fields, validate_invoice_fields, validate_contract_fields 

CONTRACT_FIELDS_CONFIG = {
    "provider_info_intro": {
        "label": "Información de la Compañía",
        "regex": r"(?i)\b(?:información de la compañía|company information)\s*[:\-]?\s*([^\n]+)"
    },
    "provider_name": {
        "label": "Nombre",
        "regex": r"(?i)\b(?:nombre|name)\s*[:\-]?\s*([^\n]+)"
    },
    "provider_ruc": {
        "label": "RUC",
        "regex": r"(?i)\b(?:ruc)\s*[:\-]?\s*(\d{13})"
    },
    "provider_transaction": {
        "label": "Transacción",
        "regex": r"(?i)\b(?:tax id)\s*[:\-]?\s*(\d{8})\b"
    },
    "provider_address": {
        "label": "Dirección de la Compañía",
        "regex": r"(?i)\b(?:dirección|address)\s*[:\-]?\s*([^\n]+)"
    },
    "provider_city": {
        "label": "Ciudad de la Compañía",
        "regex": r"(?i)\b(?:ciudad|city)\s*[:\-]?\s*([^\n]+)"
    },
    "provider_country": {
        "label": "País de la Compañía",
        "regex": r"(?i)\b(?:país|country)\s*[:\-]?\s*([^\n]+)"
    },
    "provider_phone": {
        "label": "Teléfono de la Compañía",
        "regex": r"(?i)\b(?:tel[eé]fono|phone)\s*[:\-]?\s*((?:\+?\d{1,3}[-\s]?)?(?:\(?\d{1,4}\)?[-\s]?)?\d{1,4}(?:[-\s]?\d{1,4}){1,3})"
    },
    "provider_website": {
        "label": "Página Web de la Compañía",
        "regex": r"(?i)\b(?:p[aá]gina\sweb|website)\s*[:\-]?\s*(www\.[\w\.-]+)"
    },
    "provider_email": {
        "label": "Correo Electrónico de la Compañía",
        "regex": r"(?i)\b(?:correo\s(?:electr[oó]nico|email|correo)|email)\s*[:\-]?\s*([\w._%+-]+@[a-zA-Z0-9.-]+\.com)\b"
    },
    "client_info_intro": {
        "label": "Información del Cliente",
        "regex": r"(?i)\b(?:información del cliente|client information)\b"
    },
    "client_name": {
        "label": "Nombre",
        "regex": r"(?i)\b(?:nombre|name)\s*[:\-]?\s*([^\n,]+)"
    },
    "client_ruc": {
        "label": "RUC",
        "regex": r"(?i)\b(?:ruc)\s*[:\-]?\s*(\d{13})"
    },
    "client_direction": {
        "label": "Dirección del Cliente",
        "regex": r"(?i)\b(?:dirección|address)\s*[:\-]?\s*([^\n]+)"
    },
    "client_city": {
        "label": "Ciudad del Cliente",
        "regex": r"(?i)\b(?:ciudad|city)\s*[:\-]?\s*([^\n]+)"
    },
    "client_country": {
        "label": "País del Cliente",
        "regex": r"(?i)\b(?:país|country)\s*[:\-]?\s*([^\n]+)"
    },
    "service_description_intro": {
        "label": "Descripción del Servicio",
        "regex": r"(?i)\b(?:descripción de servicios e items|description of services & items)\b"
    },
    # Para 'service_table' necesitarás un approach diferente si vas a capturar tablas, 
    # pues un simple regex no es suficiente. Puedes usar OCR y procesar línea a línea.
    "payment_terms_intro": {
        "label": "Términos de Pago",
        "regex": r"(?i)\b(?:condiciones de pago|payment terms)\b"
    },
    "subtotal": {
        "label": "Subtotal",
        "regex": r"(?i)\b(?:subtotal|subtotal \(sin impuestos|before tax)\s*[:\-]?\s*USD\s*(\d+(?:\.\d{2})?)"
    },
    "tax_rate": {
        "label": "Tasa de Impuesto",
        "regex": r"(?i)\b(?:tasa de impuesto|tax rate)\s*[:\-]?\s*(\d+(?:\.\d{1,2})?)%"
    },
    "tax_amount": {
        "label": "Monto de Impuesto",
        "regex": r"(?i)\b(?:monto de impuesto|tax amount)\s*[:\-]?\s*USD\s*(\d+(?:\.\d{2})?)"
    },
    "total_due": {
        "label": "Total a Pagar",
        "regex": r"(?i)\b(?:total a pagar|total due)\s*[:\-]?\s*USD\s*(\d+(?:\.\d{2})?)"
    },
    "contract_details_intro": {
        "label": "Detalles del Contrato",
        "regex": r"(?i)\b(?:detalles del contrato|contract details)\b"
    },
    "contract_number": {
        "label": "Número de Contrato",
        "regex": r"(?i)\b(?:número de contrato|contract number)\s*[:\-]?\s*(\d+)"
    },
    "contract_order_number": {
        "label": "Número de Orden",
        "regex": r"(?i)\b(?:número de orden|order number)\s*[:\-]?\s*(\d+)"
    },
    "contract_invoice_number": {
        "label": "Número de Factura",
        "regex": r"(?i)\b(?:número de factura|invoice number)\s*[:\-]?\s*(\d+)"
    },
    "contract_hes": {
        "label": "HES",
        "regex": r"(?i)\b(?:hes)\s*[:\-]?\s*(\d+)"
    },
    "contract_end_date": {
        "label": "Fecha de Término",
        "regex": r"(?i)\b(?:fecha de finalización|end date)\s*[:\-]?\s*(\d{2}-\d{2}-\d{4})"
    },
    "signature_intro": {
        "label": "Firmas",
        "regex": r"(?i)\b(?:firmas|signatures)\b"
    },
    # "signatures" es más complejo (campos anidados, imágenes, etc.).
    "contract_start_date": {
        "label": "Fecha de Inicio",
        "regex": r"(?i)\b(?:date|fecha)\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})"
    }
}

INVOICE_FIELDS_CONFIG = {
    "company_logo": {
        "label": "logo del proveedor",
        "type": "image",
        "region": {
            "top": 50,
            "left": 170,
            "width": 90,
            "height": 90
        }
    },
    "company_name": {
        "label": "Nombre de la Empresa",
        "region": {
            "top": 82,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_address": {
        "label": "Dirección de la Empresa",
        "region": {
            "top": 104,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_city": {
        "label": "Ciudad de la Empresa",
        "region": {
            "top": 127,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_country": {
        "label": "País de la Empresa",
        "region": {
            "top": 150,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_phone": {
        "label": "Teléfono de la Empresa",
        "regex": r"(?i)\b(?:teléfono|phone)\s*[:\-]?\s*(\+?\d[\d\-\s]+)",
        "region": {
            "top": 172,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_website": {
        "label": "Página Web de la Empresa",
        "regex": r"(?i)\b(?:página web|pagina web|website)\s*[:\-]?\s*(https?:\/\/[\w\.-]+)",
        "region": {
            "top": 194,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_email": {
        "label": "Email de la Empresa",
        "regex": r"(?i)\b(?:email)\s*[:\-]?\s*([^\s]+@[\w\.-]+)",
        "region": {
            "top": 216,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "company_tax_id": {
        "label": "ID Fiscal",
        "regex": r"(?i)\b(?:id fiscal|tax id)\s*[:\-]?\s*([^\n]+)",
        "region": {
            "top": 238,
            "left": 170,
            "width": 300,
            "height": 30
        }
    },
    "invoice_number": {
        "label": "Número de Factura",
        "regex": r"(?i)\b(?:factura n°|invoice no)\s*[:\-]?\s*(\d+)",
        "region": {
            "top": 236.83880615234375,
            "left": 170.69290161132812,
            "width": 200,
            "height": 20
        }
    },
    "invoice_date": {
        "label": "Fecha de Factura",
        "regex": r"(?i)\b(?:fecha|date)\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})",
        "region": {
            "top": 259.33880615234375,
            "left": 170.69290161132812,
            "width": 200,
            "height": 20
        }
    },
    "payable_at": {
        "label": "Fecha de Vencimiento",
        "regex": r"(?i)\b(?:vencimiento|payable at)\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})",
        "region": {
            "top": 281.83880615234375,
            "left": 170.69290161132812,
            "width": 200,
            "height": 20
        }
    },
    "order_number": {
        "label": "Número de Orden",
        "regex": r"(?i)\b(?:orden n°|order no)\s*[:\-]?\s*(\d+)",
        "region": {
            "top": 304.33880615234375,
            "left": 170.69290161132812,
            "width": 200,
            "height": 20
        }
    },
    "client_name": {
        "label": "Nombre del Cliente",
        "regex": r"(?i)\b(?:cliente|client name)\s*[:\-]?\s*([^\n]+)",
        "region": {
            "top": 236.83880615234375,
            "left": 303.07281494140625,
            "width": 200,
            "height": 20
        }
    },
    "client_ruc": {
        "label": "RUC del Cliente",
        "regex": r"(?i)\b(?:ruc)\s*[:\-]?\s*(\d+)",
        "region": {
            "top": 259.33880615234375,
            "left": 303.07281494140625,
            "width": 200,
            "height": 20
        }
    },
    "client_address": {
        "label": "Dirección del Cliente",
        "regex": r"(?i)\b(?:dirección|address)\s*[:\-]?\s*([^\n]+)",
        "region": {
            "top": 281.83880615234375,
            "left": 303.07281494140625,
            "width": 400,
            "height": 40
        }
    },
    "client_city": {
        "label": "Ciudad del Cliente",
        "regex": r"(?i)\b(?:ciudad|city)\s*[:\-]?\s*([^\n]+)",
        "region": {
            "top": 326.83880615234375,
            "left": 303.07281494140625,
            "width": 200,
            "height": 20
        }
    },
    "client_country": {
        "label": "País del Cliente",
        "regex": r"(?i)\b(?:país|country)\s*[:\-]?\s*([^\n]+)",
        "region": {
            "top": 349.33880615234375,
            "left": 303.07281494140625,
            "width": 200,
            "height": 20
        }
    },
    "service_table": {
        "label": "Tabla de Servicios",
        "type": "table",
        "columns": {
            "service_code": {
                "label": "Código",
                "regex": r"\b(?:\w{4})\b"
            },
            "service_description": {
                "label": "Descripción del Servicio",
                "regex": r".+"
            },
            "service_quantity": {
                "label": "Cantidad",
                "regex": r"\b\d+\b"
            },
            "service_unit_cost": {
                "label": "Costo Unitario",
                "regex": r"\b\d+(?:\.\d{2})\b"
            },
            "service_cost": {
                "label": "Costo",
                "regex": r"\b\d+(?:\.\d{2})\b"
            }
        }
    },
    "service_hes": {
        "label": "HES",
        "regex": r"\b(?:HES:\s?\d{8})\b"
    },
    "subtotal": {
        "label": "Subtotal",
        "regex": r"(?i)\b(?:subtotal)\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)",
        "region": {
            "top": 582.8453979492188,
            "left": 177.9153594970703,
            "width": 200,
            "height": 20
        }
    },
    "tax": {
        "label": "Impuesto",
        "regex": r"(?i)\b(?:impuesto|tax)\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)",
        "region": {
            "top": 582.8453979492188,
            "left": 177.9153594970703,
            "width": 200,
            "height": 20
        }
    },
    "total_due": {
        "label": "Total a Pagar",
        "regex": r"(?i)\b(?:total)\s*[:\-]?\s*\$?\s*(\d+(?:\.\d{2})?)",
        "region": {
            "top": 582.8453979492188,
            "left": 177.9153594970703,
            "width": 200,
            "height": 20
        }
    }
}

SERVICE_DELIVERY_RECORD_FIELDS_CONFIG = {
    "delivery_title": {
        "label": "Título del Acta",
        "regex": r"(?i)\b(?:acta de recepción|delivery receipt)\b"
    },
    "receiver_date": {
        "label": "Fecha de Recepción",
        "regex": r"(?i)\b(?:fecha|date)\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})"
    },
    "receiving_company": {
        "label": "Empresa Receptora",
        "regex": r"(?i)\b(?:empresa|company)\s*[:\-]?\s*([^\n]+)"
    },
    "provider": {
        "label": "Proveedor",
        "regex": r"(?i)\b(?:proporcionados por|provided by)\s*[:\-]?\s*([^\n]+)"
    },
    "order_number": {
        "label": "Número de Orden",
        "regex": r"(?i)\b(?:pedido identificado con el número|order identified with number)\s*[:\-]?\s*(\d+)"
    },
    "invoice_number": {
        "label": "Número de Factura",
        "regex": r"(?i)\b(?:factura número|invoice number)\s*[:\-]?\s*(\d+)"
    },
    "hes_number": {
        "label": "Número de HES",
        "regex": r"(?i)\b(?:hes asociado con el número|hes associated with the number)\s*[:\-]?\s*(\d+)"
    },
    "total_value": {
        "label": "Valor Total",
        "regex": r"(?i)\b(?:valor total de|total value of)\s*[:\-]?\s*USD\s*(\d+(?:\.\d{2})?)"
    },
    "end_date": {
        "label": "Fecha de Término",
        "regex": r"(?i)\b(?:finalizó el día|ended on)\s*[:\-]?\s*(\d{2}/\d{2}/\d{4})"
    },
    "signatures": {
        "fields": {
            "person_name": {
                "label": "Nombre de la Primera Persona",
                "regex": r"(?i)\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b"
            },
            "person_signature": {
                "label": "Firma de la Primera Persona",
                "type": "image"
            },
            "person_position": {
                "label": "Posición de la Primera Persona",
                "values": [
                    "Accounting Manager",
                    "Accounts Payable Clerk",
                    "Accounts Receivable Clerk",
                    "Tax Accountant",
                    "Payroll Specialist",
                    "Financial Analyst",
                    "Internal Auditor",
                    "Cost Accountant",
                    "Budget Analyst",
                    "Financial Controller",
                    "Gerente de Contabilidad",
                    "Asistente de Cuentas por Pagar",
                    "Asistente de Cuentas por Cobrar",
                    "Contador de Impuestos",
                    "Especialista de Nómina",
                    "Analista Financiero",
                    "Auditor Interno",
                    "Contador de Costos",
                    "Analista Presupuestario",
                    "Controlador Financiero"
                ]
            },
            "person_company": {
                "label": "Empresa de la Primera Persona",
                "regex": r"(?i)\b(?:empresa|company)\s*[:\-]?\s*([^\n]+)"
            }
        }
    }
}

def process_contract(file_path):
    if file_path.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.xml'):
        text_dict = extract_data_from_xml(file_path)
        text = str(text_dict)
    else:
        return {"error": "Formato no soportado para contrato"}

    extracted_fields = {}
    for field_key, field_config in CONTRACT_FIELDS_CONFIG.items():
        pattern = field_config["regex"]
        match = re.search(pattern, text)
        if match:
            extracted_fields[field_key] = match.group(1).strip()
        else:
            extracted_fields[field_key] = None

    validation_result = validate_contract_fields(extracted_fields)
    if validation_result["valid"]:
        return {
            "type": "contract",
            "extracted_fields": extracted_fields
        }
    else:
        return {
            "type": "contract",
            "errors": validation_result["errors"],
            "extracted_fields": extracted_fields  
        }

def process_invoice(file_path):
    """
    Procesa un documento de tipo Factura (Invoice).
    1. Extrae texto (si es PDF o imagen) o parsea XML.
    2. Aplica regex (cuando exista) a cada campo definido en INVOICE_FIELDS_CONFIG.
    3. Maneja campos especiales (type: image, type: table).
    4. Valida y retorna el resultado.
    """

    # 1. Extraer texto
    if file_path.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    elif file_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        text = extract_text_from_image(file_path)
    elif file_path.lower().endswith('.xml'):
        text_dict = extract_data_from_xml(file_path)
        text = str(text_dict)
    else:
        return {"error": "Formato no soportado para invoice"}

    # 2. Mapeo de campos
    extracted_fields = {}

    for field_key, field_config in INVOICE_FIELDS_CONFIG.items():

        # A) Campos de "imagen"
        if field_config.get("type") == "image":
            # Lógica para extraer la imagen desde la región (por ejemplo, recortar con OCR).
            # Aquí pondremos un placeholder:
            extracted_fields[field_key] = None  # O la ruta donde guardaste la imagen recortada.
            continue

        # B) Campos de "tabla"
        if field_config.get("type") == "table":
            # Ejemplo simple, parsear tabla a partir de lineas de texto
            # Realmente necesitarás lógica más compleja que detecte filas y aplique `regex` a cada columna.
            table_data = extract_service_table(text, field_config["columns"])
            extracted_fields[field_key] = table_data
            continue

        # C) Campos con regex "normal" (campo simple)
        if "regex" in field_config:
            pattern = field_config["regex"]
            match = re.search(pattern, text)
            if match:
                extracted_fields[field_key] = match.group(1).strip()
            else:
                extracted_fields[field_key] = None
        else:
            # Si no hay regex, quizá se extrae de la región con OCR o se deja None
            extracted_fields[field_key] = None

    # 3. Validar
    validation_result = validate_invoice_fields(extracted_fields)
    if validation_result["valid"]:
        return {
            "type": "invoice",
            "extracted_fields": extracted_fields
        }
    else:
        return {
            "type": "invoice",
            "errors": validation_result["errors"],
            "extracted_fields": extracted_fields
        }

def process_service_delivery_record(file_path):
    if file_path.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_path)
    elif file_path.lower().endswith('.xml'):
        text_dict = extract_data_from_xml(file_path)
        text = str(text_dict)
    else:
        return {"error": "Formato no soportado para Service Delivery Record"}

    extracted_fields = {}

    for field_key, field_config in SERVICE_DELIVERY_RECORD_FIELDS_CONFIG.items():
        if "fields" in field_config:
            nested_fields = {}
            for sub_key, sub_config in field_config["fields"].items():
                if "regex" in sub_config:
                    match = re.search(sub_config["regex"], text)
                    if match:
                        nested_fields[sub_key] = match.group(1).strip()
                    else:
                        nested_fields[sub_key] = None
                else:
                    # ejemplo: es "type": "image"
                    nested_fields[sub_key] = None  # Podrías poner la ruta de la firma, etc.

            extracted_fields[field_key] = nested_fields
        else:
            # Campo "normal" con un "regex" a nivel principal
            pattern = field_config["regex"]
            match = re.search(pattern, text)
            if match:
                extracted_fields[field_key] = match.group(1).strip()
            else:
                extracted_fields[field_key] = None

    # 3. Validaciones
    validation_result = validate_service_delivery_record_fields(extracted_fields)

    if validation_result["valid"]:
        return {
            "type": "service_delivery_record",
            "extracted_fields": extracted_fields
        }
    else:
        return {
            "type": "service_delivery_record",
            "errors": validation_result["errors"],
            "extracted_fields": extracted_fields
        }