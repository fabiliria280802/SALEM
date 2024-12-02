# Description: generate documents for training, validation and test.
# By: Mateo Avila & Fabiana Liria
# version: 2.2

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from random import choice, randint
import os

def generate_contract(output_path, contrato_number, empresa_contratante, empresa_contratada, servicio, fecha_inicio, fecha_termino):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 50, "CONTRATO DE SERVICIO")

    c.setFont("Helvetica", 10)
    text = f"""
    Contrato N°: {contrato_number}
    Empresa Contratante: {empresa_contratante}
    Empresa Contratada: {empresa_contratada}
    Servicio: {servicio}
    Fecha de inicio: {fecha_inicio}
    Fecha de término: {fecha_termino}

    Por medio del presente contrato, la empresa {empresa_contratada} se compromete a realizar el servicio de {servicio} para la empresa {empresa_contratante}, desde el {fecha_inicio} hasta el {fecha_termino}.
    """
    text_lines = text.strip().split("\n")
    y_position = height - 100
    for line in text_lines:
        c.drawString(50, y_position, line.strip())
        y_position -= 15

    c.save()

def generate_record(output_path, hes_number, empresa_receptora, servicio, ubicacion, nombres, cargos, contrato, fecha_inicio, fecha_termino):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 50, "ACTA DE RECEPCIÓN DE SERVICIOS")
    c.setFont("Helvetica", 10)
    text = f"""
    Número de HES: {hes_number}
    Contrato N°: {contrato}
    Servicio: {servicio}
    Empresa que recibe el servicio: {empresa_receptora}
    Ubicación del servicio: {ubicacion}
    Fecha de inicio: {fecha_inicio}
    Fecha de término: {fecha_termino}

    Se certifica que el servicio de {servicio} ha sido recibido satisfactoriamente en {ubicacion}, según los términos establecidos en el contrato N° {contrato}.
    """
    text_lines = text.strip().split("\n")
    y_position = height - 150
    for line in text_lines:
        c.drawString(50, y_position, line.strip())
        y_position -= 15
    c.drawString(50, y_position - 20, "Por la Empresa Proveedora del Servicio:")
    c.drawString(350, y_position - 20, "Por la Empresa Receptora del Servicio:")
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, y_position - 60, nombres[0])
    c.drawString(350, y_position - 60, nombres[1])
    c.line(50, y_position - 70, 200, y_position - 70)
    c.line(350, y_position - 70, 500, y_position - 70)
    c.setFont("Helvetica", 9)
    c.drawString(50, y_position - 90, f"{nombres[0]}, {cargos[0]}")
    c.drawString(350, y_position - 90, f"{nombres[1]}, {cargos[1]}")
    c.save()

def generate_invoice(output_path, factura_number, empresa_emisora, empresa_receptora, servicio, monto, fecha_emision):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    # Cálculos financieros
    subtotal = monto
    descuento_porcentaje = choice([0, 5, 10, 15, 20])  # Descuento aleatorio
    descuento = (subtotal * descuento_porcentaje) / 100
    subtotal_con_descuento = subtotal - descuento
    iva = subtotal_con_descuento * 0.15  # IVA 15%
    total = subtotal_con_descuento + iva

    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 50, "FACTURA")

    c.setFont("Helvetica", 10)
    text = f"""
    Factura N°: {factura_number}
    Fecha de Emisión: {fecha_emision}
    Empresa Emisora: {empresa_emisora}
    Empresa Receptora: {empresa_receptora}

    Detalle:
    Servicio: {servicio}

    Subtotal: ${subtotal:.2f}
    Descuento ({descuento_porcentaje}%): ${descuento:.2f}
    Subtotal con descuento: ${subtotal_con_descuento:.2f}
    IVA (15%): ${iva:.2f}

    Total a pagar: ${total:.2f}
    """
    text_lines = text.strip().split("\n")
    y_position = height - 100
    for line in text_lines:
        c.drawString(50, y_position, line.strip())
        y_position -= 15

    c.save()

def generate_documents(output_dir, start_hes=1, count=900):
    os.makedirs(output_dir, exist_ok=True)
    empresa_receptora = "ENAP SIPETROL S.A."
    empresa_proveedora = "Servicios Técnicos S.A."
    servicios = ["Mantenimiento de instalaciones", "Inspección de equipos", "Capacitación técnica", "Transporte de materiales"]
    ubicaciones = [
        "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora Chinchipe"
    ]
    nombres_proveedores = ["Juan Pérez", "Carlos Sánchez", "Ana Martínez", "María Gómez"]
    nombres_receptores = ["Luis Morales", "Sofía Ortega", "Diego Fernández", "Gabriela Torres"]
    cargos_proveedores = ["Ingeniero de Proyectos", "Técnico Supervisor", "Gerente de Operaciones", "Consultor Técnico"]
    cargos_receptores = ["Administrador de Contratos", "Coordinador Logístico", "Supervisor de Área", "Jefe de Operaciones"]

    for i in range(start_hes, start_hes + count):
        hes_number = f"record-{i:03}"
        contrato_number = f"contract-{i:03}"
        factura_number = f"invoice-{i:03}"
        servicio = choice(servicios)
        ubicacion = choice(ubicaciones)
        nombres = [choice(nombres_proveedores), choice(nombres_receptores)]
        cargos = [choice(cargos_proveedores), choice(cargos_receptores)]
        fecha_inicio = f"{randint(1, 28):02}/11/2024"
        fecha_termino = f"{randint(1, 28):02}/12/2024"
        fecha_emision = f"{randint(1, 28):02}/12/2024"
        monto = randint(1000, 5000)

        # Generar Contrato
        contrato_path = os.path.join(output_dir, f"{contrato_number}.pdf")
        generate_contract(contrato_path, contrato_number, empresa_receptora, empresa_proveedora, servicio, fecha_inicio, fecha_termino)

        # Generar Acta de Recepción
        acta_path = os.path.join(output_dir, f"{hes_number}.pdf")
        generate_record(acta_path, hes_number, empresa_receptora, servicio, ubicacion, nombres, cargos, contrato_number, fecha_inicio, fecha_termino)

        # Generar Factura
        factura_path = os.path.join(output_dir, f"{factura_number}.pdf")
        generate_invoice(factura_path, factura_number, empresa_proveedora, empresa_receptora, servicio, monto, fecha_emision)

def generate_documents_with_errors(output_dir, start_index=901, count=50):
    os.makedirs(output_dir, exist_ok=True)
    empresa_receptora = "ENAP SIPETROL S.A."
    empresa_proveedora = "Servicios Técnicos S.A."
    servicios = ["Mantenimiento de instalaciones", "Inspección de equipos", "Capacitación técnica", "Transporte de materiales"]
    ubicaciones = [
        "Azuay", "Bolívar", "Cañar", "Carchi", "Chimborazo", "Cotopaxi", "El Oro", "Esmeraldas", "Galápagos", "Guayas", "Imbabura", "Loja", "Los Ríos", "Manabí", "Morona Santiago", "Napo", "Orellana", "Pastaza", "Pichincha", "Santa Elena", "Santo Domingo de los Tsáchilas", "Sucumbíos", "Tungurahua", "Zamora Chinchipe"
    ]
    nombres_proveedores = ["Juan Pérez", "Carlos Sánchez", "Ana Martínez", "María Gómez"]
    nombres_receptores = ["Luis Morales", "Sofía Ortega", "Diego Fernández", "Gabriela Torres"]
    cargos_proveedores = ["Ingeniero de Proyectos", "Técnico Supervisor", "Gerente de Operaciones", "Consultor Técnico"]
    cargos_receptores = ["Administrador de Contratos", "Coordinador Logístico", "Supervisor de Área", "Jefe de Operaciones"]

    for i in range(start_index, start_index + count):
        hes_number = f"record-{i:03}-error"
        contrato_number = f"contract-{i:03}-error"
        factura_number = f"invoice-{i:03}-error"

        servicio = choice(servicios)
        ubicacion = choice(ubicaciones)
        nombres = [choice(nombres_proveedores), choice(nombres_receptores)]
        cargos = [choice(cargos_proveedores), choice(cargos_receptores)]

        # Fechas y montos con errores
        fecha_inicio = f"{randint(29, 31):02}/02/2024"  # Fecha inválida (ejemplo: 30/02/2024)
        fecha_termino = f"{randint(29, 31):02}/11/2024"
        fecha_emision = f"{randint(29, 31):02}/11/2024"  # Fecha fuera de rango
        monto = randint(1000, 5000)
        monto_erroneo = monto * randint(2, 5)  # Generar un monto incorrecto

        # Generar Contrato con errores
        contrato_path = os.path.join(output_dir, f"{contrato_number}.pdf")
        generate_contract(contrato_path, contrato_number, "", empresa_proveedora, servicio, fecha_inicio, fecha_termino)  # Falta el campo "empresa_receptora"

        # Generar Acta de Recepción con errores
        acta_path = os.path.join(output_dir, f"{hes_number}.pdf")
        generate_record(
            acta_path, hes_number, empresa_receptora, "", ubicacion, nombres, cargos, contrato_number, fecha_inicio, fecha_termino
        )  # Falta el campo "servicio"

        # Generar Factura con errores
        factura_path = os.path.join(output_dir, f"{factura_number}.pdf")
        generate_invoice(
            factura_path,
            factura_number,
            empresa_proveedora,
            empresa_receptora,
            servicio,
            monto_erroneo,  # Monto incorrecto
            fecha_emision,
        )

output_directory = "./practice"
generate_documents(output_directory, start_hes=1, count=900)
generate_documents_with_errors(output_directory, start_index=901, count=50)