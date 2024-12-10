# Description: generate documents for training, validation and test.
# By: Mateo Avila & Fabiana Liria
# version: 2.4

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from random import choice, randint
import os
from textwrap import wrap

# Función para envolver texto en párrafos largos
def wrap_text(c, text, max_width, start_x, start_y, line_height=15, font_name="Helvetica", font_size=10):
    c.setFont(font_name, font_size)
    wrapped_lines = wrap(text.strip(), width=max_width)
    y = start_y
    for line in wrapped_lines:
        c.drawString(start_x, y, line)
        y -= line_height
    return y

# Generar contrato con múltiples páginas
def generate_contract(output_path, contrato_number, empresa_contratante, empresa_contratada, servicio, fecha_inicio, fecha_termino):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    total_pages = randint(10, 15)

    for page in range(total_pages):
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, height - 50, f"CONTRATO DE SERVICIO - Página {page + 1}")

        c.setFont("Helvetica", 10)
        y = height - 100
        line_height = 15
        if page == 0:
            # Primera página con información general
            info_lines = [
                f"Contrato N°: {contrato_number}",
                f"Empresa Contratante: {empresa_contratante}",
                f"Empresa Contratada: {empresa_contratada}",
                f"Servicio: {servicio}",
                f"Fecha de inicio: {fecha_inicio}",
                f"Fecha de término: {fecha_termino}",
                "",
                "Términos y condiciones del servicio:"
            ]
            for line in info_lines:
                c.drawString(50, y, line)
                y -= line_height

        # Contenido adicional
        parrafo = ("Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
                   "Phasellus interdum sapien non dui convallis, quis facilisis purus suscipit. "
                   "Nulla facilisi. " * 10)
        y = wrap_text(c, parrafo, max_width=80, start_x=50, start_y=y, line_height=line_height, font_size=10)

        c.showPage()
    c.save()

# Generar acta con múltiples páginas
def generate_record(output_path, hes_number, empresa_receptora, servicio, ubicacion, nombres, cargos, contrato, fecha_inicio, fecha_termino):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    total_pages = randint(10, 15)

    for page in range(total_pages):
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, height - 50, f"ACTA DE RECEPCIÓN DE SERVICIOS - Página {page + 1}")

        c.setFont("Helvetica", 10)
        y = height - 100
        line_height = 15
        if page == 0:
            # Primera página con información general
            info_lines = [
                f"Número de HES: {hes_number}",
                f"Contrato N°: {contrato}",
                f"Servicio: {servicio}",
                f"Empresa que recibe el servicio: {empresa_receptora}",
                f"Ubicación del servicio: {ubicacion}",
                f"Fecha de inicio: {fecha_inicio}",
                f"Fecha de término: {fecha_termino}",
                "",
                "Detalles de recepción:"
            ]
            for line in info_lines:
                c.drawString(50, y, line)
                y -= line_height

        # Contenido adicional
        parrafo = ("Donec a velit sit amet urna vehicula condimentum. "
                   "Mauris sit amet elit sit amet arcu blandit vulputate. "
                   "Proin sed nisi nec nunc sodales sagittis. " * 10)
        y = wrap_text(c, parrafo, max_width=80, start_x=50, start_y=y, line_height=line_height, font_size=10)

        c.showPage()
    c.save()

# Generar factura con múltiples páginas
def generate_invoice(output_path, factura_number, empresa_emisora, empresa_receptora, servicio, monto, fecha_emision):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    total_pages = randint(10, 15)

    for page in range(total_pages):
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2, height - 50, f"FACTURA - Página {page + 1}")

        c.setFont("Helvetica", 10)
        y = height - 100
        line_height = 15
        if page == 0:
            # Primera página con información general
            info_lines = [
                f"Factura N°: {factura_number}",
                f"Fecha de Emisión: {fecha_emision}",
                f"Empresa Emisora: {empresa_emisora}",
                f"Empresa Receptora: {empresa_receptora}",
                f"Servicio: {servicio}",
                "",
                f"Monto Total: ${monto:.2f}",
                "",
                "Detalle:"
            ]
            for line in info_lines:
                c.drawString(50, y, line)
                y -= line_height

        # Contenido adicional
        detalle = ("Elemento XYZ - Descripción extendida del producto o servicio.\n" * 50)
        y = wrap_text(c, detalle, max_width=80, start_x=50, start_y=y, line_height=line_height, font_size=10)

        c.showPage()
    c.save()

def generate_documents(output_dir, start_hes=1, count=1):
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

def generate_documents_with_errors(output_dir, start_index=2, count=1):
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
        fecha_inicio = f"{randint(29, 31):02}/02/2024"  # Fecha inválida
        fecha_termino = f"{randint(29, 31):02}/11/2024"
        fecha_emision = f"{randint(29, 31):02}/11/2024"
        monto = randint(1000, 5000)
        monto_erroneo = monto * randint(2, 5)

        # Contrato con errores (falta empresa_receptora)
        contrato_path = os.path.join(output_dir, f"{contrato_number}.pdf")
        generate_contract(contrato_path, contrato_number, "", empresa_proveedora, servicio, fecha_inicio, fecha_termino)

        # Acta con errores (falta servicio)
        acta_path = os.path.join(output_dir, f"{hes_number}.pdf")
        generate_record(acta_path, hes_number, empresa_receptora, "", ubicacion, nombres, cargos, contrato_number, fecha_inicio, fecha_termino)

        # Factura con errores (monto incorrecto)
        factura_path = os.path.join(output_dir, f"{factura_number}.pdf")
        generate_invoice(
            factura_path,
            factura_number,
            empresa_proveedora,
            empresa_receptora,
            servicio,
            monto_erroneo,
            fecha_emision,
        )

output_directory = "./practice"
generate_documents(output_directory, start_hes=1, count=1)
generate_documents_with_errors(output_directory, start_index=2, count=1)