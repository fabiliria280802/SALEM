from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from random import choice
import os

# Función para generar una factura que se asemeje al ejemplo proporcionado
def generate_invoice(output_path, factura_number, empresa_emisora, cliente_nombre, cliente_direccion, items, total_sin_impuestos, impuestos, total, logo_folder):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    # Logo de la empresa emisora
    logo_file = choice([f for f in os.listdir(logo_folder) if f.startswith("logo-test")])
    logo_path = os.path.join(logo_folder, logo_file)
    c.drawImage(logo_path, 50, height - 70, width=100, height=30, preserveAspectRatio=True)

    # Encabezado de la factura
    c.setFont("Helvetica-Bold", 12)
    c.drawString(200, height - 50, "Factura")
    c.setFont("Helvetica", 10)
    c.drawString(200, height - 65, f"Factura N°: {factura_number}")
    c.drawString(200, height - 80, f"Fecha: {items[0].get('fecha', '07-MAY-2024')}")

    # Información de la empresa emisora
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 120, empresa_emisora)
    c.setFont("Helvetica", 9)
    c.drawString(50, height - 135, "Avda. República Argentina entre Francia y Londres")
    c.drawString(50, height - 150, "Punta del Este, Uruguay")
    c.drawString(50, height - 165, "Tel: +598 4247 6565")

    # Información del cliente
    c.setFont("Helvetica-Bold", 10)
    c.drawString(350, height - 120, "Cliente:")
    c.setFont("Helvetica", 9)
    c.drawString(350, height - 135, cliente_nombre)
    c.drawString(350, height - 150, cliente_direccion)

    # Línea divisoria
    c.setStrokeColor(colors.grey)
    c.setLineWidth(0.5)
    c.line(50, height - 170, width - 50, height - 170)

    # Detalles de la factura
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 190, "Ítem")
    c.drawString(150, height - 190, "Descripción")
    c.drawString(400, height - 190, "Costo")

    # Agregar los ítems
    y = height - 210
    c.setFont("Helvetica", 9)
    for item in items:
        c.drawString(50, y, item['codigo'])
        c.drawString(150, y, item['descripcion'])
        c.drawString(400, y, f"${item['costo']:.2f}")
        y -= 15

    # Totales
    c.setFont("Helvetica-Bold", 10)
    y -= 20
    c.drawString(350, y, f"Total sin impuestos: ${total_sin_impuestos:.2f}")
    y -= 15
    c.drawString(350, y, f"Impuestos: ${impuestos:.2f}")
    y -= 15
    c.drawString(350, y, f"Total: ${total:.2f}")

    # Footer
    c.setFont("Helvetica", 8)
    y -= 40
    c.drawString(50, y, "Para transferencias internacionales, consulte las instrucciones adjuntas.")
    c.drawString(50, y - 15, "Gracias por su preferencia.")

    c.showPage()
    c.save()

# Datos de prueba
output_path = "./factura_ejemplo.pdf"
logo_folder = "../assets"

factura_number = "SAM-240404-0274"
empresa_emisora = "KAPPAENG South America S.A."
cliente_nombre = "ENAP SIPETROL S.A."
cliente_direccion = "AV. GRANADOS VIA A NAYON, EDIFICIO EKOPARK, OFICINA 3 PISO 3, ECUADOR"

items = [
    {"codigo": "MCE", "descripcion": "Maintenance of KAPPA software", "costo": 13990.00, "fecha": "07-MAY-2024"},
]

total_sin_impuestos = 13990.00
impuestos = 0.00
total = 13990.00

# Generar la factura
generate_invoice(output_path, factura_number, empresa_emisora, cliente_nombre, cliente_direccion, items, total_sin_impuestos, impuestos, total, logo_folder)

