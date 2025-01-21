import re
import pytesseract
import fitz
from PIL import Image
import numpy as np
import cv2
import io
import camelot

from utils import load_document_schema

# Contract
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
    current_position = 0  # Posición inicial para la búsqueda

    while current_field:
        field_info = field_relations.get(current_field)
        if not field_info:
            break  # No hay más relaciones

        regex = field_info.get("regex")
        if not regex:
            break  # El campo no tiene regex definido

        # Buscar el texto a partir de la posición actual
        match = re.search(regex, text[current_position:])
        if match:
            extracted_data[current_field] = match.group(1).strip()
            current_position += match.end()  # Actualizar posición para el siguiente campo
        else:
            print(f"No se encontró el campo {current_field} en la secuencia.")
            break  # Termina si no encuentra el campo actual

        # Pasar al siguiente campo en la relación
        current_field = next((k for k, v in field_relations.items() if v.get("relative_to") == current_field), None)

    return extracted_data

def extract_provider_fields(text):
    # Cargar esquema relacionado con el proveedor
    schema = load_document_schema()["Contract"]["fields"]  # Asegúrate de que esta ruta sea correcta

    # Iniciar la extracción desde el campo inicial
    start_field = "provider_info_intro"
    provider_data = extract_sequential_fields(text, schema, start_field, provider_field_relations)

    return provider_data

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

def extract_table_with_camelot(pdf_path, page_number):
    """
    Extrae tablas del PDF utilizando Camelot.
    """
    tables = camelot.read_pdf(pdf_path, pages=str(page_number), flavor='stream')  # stream para tablas sin líneas
    if not tables:
        return [], ["No se encontraron tablas en la página."]
    
    table_data = []
    for table in tables:
        df = table.df
        table_data.extend(df.to_dict(orient="records"))
    
    return table_data, []

def extract_table_data(text, table_schema):
    """
    Extrae datos de una tabla en el texto basado en un esquema.
    """
    table_data = []
    errors = []
    missing_fields = set(table_schema["columns"].keys())
    lines = text.split("\n")
    
    # Localizar el inicio de la tabla con encabezado
    header_pattern = r"(?i)\b(?:Code|Description|HES|Quantity|Unit Cost|Cost)\b"
    start_row = None
    for i, line in enumerate(lines):
        if re.search(header_pattern, line):
            start_row = i + 1
            break

    if start_row is None:
        return table_data, ["No se encontró el encabezado de la tabla."]
    
    # Detectar fin de tabla
    END_OF_TABLE_PATTERN = r"(?i)^•+\s*$"

    current_row = []
    for line in lines[start_row:]:
        if re.search(END_OF_TABLE_PATTERN, line):  # Fin de tabla
            break

        # Si la línea está vacía, procesar la fila acumulada
        if line.strip() == "":
            if current_row:
                row = process_row(" ".join(current_row), table_schema)
                if row:
                    table_data.append(row)
                else:
                    errors.append(f"Fila mal formateada: {' '.join(current_row)}")
                current_row = []
            continue

        current_row.append(line.strip())

    # Procesar la última fila acumulada
    if current_row:
        row = process_row(" ".join(current_row), table_schema)
        if row:
            table_data.append(row)
        else:
            errors.append(f"Fila mal formateada: {' '.join(current_row)}")

    return table_data, errors

def process_row(row_text, table_schema):
    """
    Procesa una fila acumulada y la mapea a las columnas del esquema.
    """
    row = {}
    row_data = re.split(r"\s{2,}", row_text)  # Separar por múltiples espacios

    for col_name, col_info in table_schema["columns"].items():
        cell = row_data.pop(0) if row_data else ""
        match = re.match(col_info["regex"], cell)
        row[col_name] = match.group(0) if match else None

    return row

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

def detect_signature_regions(image):
    """
    Detecta regiones que probablemente contengan firmas usando procesamiento de imágenes.
    """
    # Convertir imagen PIL a formato OpenCV
    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
    
    # Aplicar umbral adaptativo
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 11, 2
    )
    
    # Encontrar contornos
    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    signature_regions = []
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        
        # Filtrar por tamaño y proporción
        area = w * h
        aspect_ratio = w / float(h)
        
        if (area > 5000 and  # Área mínima
            area < 50000 and  # Área máxima
            aspect_ratio > 1.5 and  # Más ancho que alto
            aspect_ratio < 4):  # No demasiado alargado
            
            # Expandir región para incluir texto cercano
            expanded_region = {
                "left": max(0, x - 20),
                "top": max(0, y - 20),
                "width": min(w + 40, image.width - x),
                "height": min(h + 40, image.height - y)
            }
            signature_regions.append(expanded_region)
    
    return signature_regions

def extract_signature_info(image, signature_region):
    """
    Extrae información de firma de una región específica.
    """
    # Extraer texto de la región expandida
    text = extract_field_from_region(image, {"region": signature_region})
    
    # Buscar patrones de nombre y cargo
    name_pattern = r'(?i)(?:firma|firmado por|firmas|signed by)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})'
    position_pattern = r'(?i)(?:cargo|position|puesto)?\s*((?:Gerente|Director|Supervisor|Contador|Manager|Director|Supervisor|Accountant)[a-zA-Z\s]*)'
    
    name_match = re.search(name_pattern, text) if text else None
    position_match = re.search(position_pattern, text) if text else None
    
    return {
        "name": name_match.group(1) if name_match else None,
        "position": position_match.group(1) if position_match else None,
        "region": signature_region
    }

def extract_signatures_from_image(image):
    """
    Detecta y extrae información de todas las firmas en una imagen.
    """
    signature_regions = detect_signature_regions(image)
    signatures = []
    
    for region in signature_regions:
        signature_info = extract_signature_info(image, region)
        if signature_info["name"] or signature_info["position"]:
            signatures.append(signature_info)
    
    return signatures

def extract_text_from_pdf(file_path):
    """
    Extrae texto directamente del PDF usando PyMuPDF.
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error al extraer texto del PDF {file_path}: {e}")

def extract_images_from_pdf(pdf_path):
    """
    Extrae imágenes incrustadas de un PDF.
    """
    images = []
    try:
        doc = fitz.open(pdf_path)
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                images.append({
                    "page": page_num + 1,
                    "index": img_index + 1,
                    "image": Image.open(io.BytesIO(image_bytes))
                })
        doc.close()
    except Exception as e:
        raise ValueError(f"Error extrayendo imágenes del PDF {pdf_path}: {e}")
    return images

def extract_section_from_pdf(text, start_marker, end_marker=None):
    """
    Extrae una sección específica del texto usando marcadores.
    """
    start_idx = text.find(start_marker)
    end_idx = text.find(end_marker, start_idx) if end_marker else len(text)
    if start_idx == -1:
        return None
    return text[start_idx:end_idx].strip()

def extract_text_near_signature(image, position_index):
    """
    Extrae texto de una región cercana a una firma en la imagen.
    """
    signature_regions = [
        (50, 600, 450, 900),  # Región ampliada para la primera firma
        (500, 600, 850, 900)  # Región ampliada para la segunda firma
    ]

    try:
        region = signature_regions[position_index]
        cropped_region = image.crop(region)
        config = '--psm 6'  # Suposición de texto por bloques
        text = pytesseract.image_to_string(cropped_region, lang="eng+spa", config=config)
        return text.strip()
    except Exception as e:
        print(f"Error al extraer texto cerca de la firma en la posición {position_index}: {str(e)}")
        return ""

# Services delivery record

# Invoice
def normalize_text(text):
    normalized = re.sub(r"\s+", " ", text.strip())
    print("Texto normalizado:", normalized)
    return normalized

def extract_invoice_data(pdf_path):
    extracted_data = {}

    try:
        doc = fitz.open(pdf_path)

        # Bloque 1: Información de la empresa
        page = doc[0]
        company_block = page.get_text("blocks")
        company_text = " ".join(block[4] for block in company_block if block[1] < 200)
        #fix: print("Texto de la empresa:", company_text)
        company_data = extract_company_info(company_text)
        extracted_data.update(company_data)

        # Bloque 2: Información de la factura
        invoice_block = page.get_text("blocks")
        invoice_text = " ".join(block[4] for block in invoice_block if 200 < block[1] < 350)
        #fix: done print("Texto de la factura:", invoice_text)
        invoice_data = extract_invoice_info(invoice_text)  # Extraer datos de la factura
        extracted_data.update(invoice_data)

        order_number = invoice_data.get("order_number")
        if not order_number:
            raise ValueError("No se pudo extraer el número de orden (order_number).")

        # Bloque 3: Información del cliente
        client_block = page.get_text("blocks")
        client_text = " ".join(block[4] for block in client_block if 220 < block[1] < 400)
        #fix: print("Texto del cliente:", client_text)
        client_data = extract_client_info(client_text, order_number)  # Pasar `order_number`
        extracted_data.update(client_data)

        # Bloque 4: Tabla de servicios
        total_block = page.get_text("blocks")
        total_text = " ".join(block[4] for block in total_block if block[1] > 400)
        #fix: print("Texto de tablas:", total_text)
        table_data = extract_table_info(total_text)
        extracted_data.update(table_data)

        # Bloque 5: Totales
        total_block = page.get_text("blocks")
        total_text = " ".join(block[4] for block in total_block if block[1] > 450)
        #fix: Descomentar linea print("Texto de totales:", total_text)
        extracted_data.update(extract_totals(total_text))

    except Exception as e:
        print(f"Error al procesar el PDF: {e}")

    return extracted_data

def extract_company_info(text):
    text_lines = [line.strip() for line in text.splitlines() if line.strip()]  

    company_data = {
        "company_logo": "La imagen se encontró en el bloque",
        "company_name": text_lines[0] if text_lines else None, 
        "company_address": None,
        "company_city": None,
        "company_country": None,
        "company_phone": None,
        "company_website": None,
        "company_email": None,
        "company_tax_id": None,
    }

    # Encontrar campos específicos con expresiones regulares
    for i, line in enumerate(text_lines):
        if "Phone:" in line:
            company_data["company_phone"] = re.search(r"Phone:\s*([\+0-9\-x]+)", line).group(1)
        if "www." in line:
            company_data["company_website"] = re.search(r"(www\.\S+)", line).group(1)
        if "@" in line:
            company_data["company_email"] = re.search(r"(\S+@\S+)", line).group(1)
        if "Tax ID:" in line:
            company_data["company_tax_id"] = re.search(r"Tax ID:\s*(\d+)", line).group(1)

    # Determinar `company_city` y `company_country`
    if company_data["company_phone"]:
        phone_index = text_lines.index(next(line for line in text_lines if "Phone:" in line))
        if phone_index >= 2:
            company_data["company_country"] = text_lines[phone_index - 1]
            company_data["company_city"] = text_lines[phone_index - 2]

    # Determinar `company_address`
    if company_data["company_city"]:
        city_index = text_lines.index(company_data["company_city"])
        if city_index >= 2:
            company_data["company_address"] = ", ".join(text_lines[1:city_index])

    return company_data

def extract_invoice_info(text):
    text_lines = [line.strip() for line in text.splitlines() if line.strip()]

    if len(text_lines) < 8:
        raise ValueError("El texto no contiene suficientes líneas para extraer datos.")

    labels = text_lines[:4]
    values = text_lines[4:8]

    keys = ["invoice_number", "invoice_date", "payable_at", "order_number"]

    return dict(zip(keys, values))

def extract_client_info(text, order_number):
    text_lines = [line.strip() for line in text.splitlines() if line.strip()]

    try:
        order_index = text_lines.index(order_number)
    except ValueError:
        raise ValueError(f"No se encontró el número de orden {order_number} en el texto.")

    client_lines = text_lines[order_index + 1:] 

    client_data = {
        "client_name": client_lines[0] if len(client_lines) > 0 else None,
        "client_ruc": re.search(r"RUC:\s*(\d+)", client_lines[1]).group(1) if len(client_lines) > 1 and "RUC:" in client_lines[1] else None,
        "client_address": ", ".join(client_lines[2:4]) if len(client_lines) > 3 else None,
        "client_city": client_lines[4] if len(client_lines) > 4 else None,
        "client_country": client_lines[5] if len(client_lines) > 5 else None,
    }

    return client_data

def extract_table_info(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    # Detectar encabezados (primeros textos conocidos)
    headers = lines[:5]  # Tomar los primeros 5 textos como encabezados
    print("Encabezados detectados:", headers)

    # Recortar las líneas hasta "Subtotal"
    if "Subtotal" in lines:
        subtotal_index = lines.index("Subtotal")
        data_lines = lines[5:subtotal_index]  # Excluir líneas después de "Subtotal"
    else:
        data_lines = lines[5:]
    print("Líneas de datos recortadas:", data_lines)

    # Dividir en bloques de tamaño fijo (6 líneas por fila)
    rows = [data_lines[i:i + 6] for i in range(0, len(data_lines), 6)]
    print("Filas agrupadas:", rows)

    # Inicializar listas para los campos
    service_code = []
    service_description = []
    service_quantity = []
    service_unit_cost = []
    service_cost = []
    service_hes = []

    # Procesar cada fila
    for row in rows:
        print("Procesando fila:", row)
        if len(row) != 6:  # Validar que la fila tenga exactamente 6 elementos
            print(f"Fila incompleta detectada y omitida: {row}")
            continue

        # Asignar valores desde el bloque
        service_code.append(row[0])  # Código
        service_description.append(row[1])  # Descripción
        service_hes.append(row[2].split(":")[1].strip())  # HES
        service_quantity.append(row[3])  # Cantidad
        service_unit_cost.append(row[4].replace("$", ""))  # Costo Unitario
        service_cost.append(row[5].replace("$", ""))  # Costo Total

    # Retornar los datos como un diccionario
    return {
        "service_code": service_code,
        "service_description": service_description,
        "service_quantity": service_quantity,
        "service_unit_cost": service_unit_cost,
        "service_cost": service_cost,
        "service_hes": service_hes,
    }

def extract_totals(text):
    return {
        "subtotal": re.search(r"Subtotal\s*\$(\d+\.\d{2})", text).group(1),
        "tax": re.search(r"Tax\s*\$(\d+\.\d{2})", text).group(1),
        "total_due": re.search(r"Total\s*\$(\d+\.\d{2})", text).group(1)
    }
