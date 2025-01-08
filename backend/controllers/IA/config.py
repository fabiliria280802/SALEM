import os
import pytesseract
from PIL import Image
from dotenv import load_dotenv
import warnings

# Ignorar advertencias innecesarias
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

# Configurar Tesseract
load_dotenv()
pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD')
os.environ['TESSDATA_PREFIX'] = os.getenv('TESSDATA_PREFIX')

# Debug de configuración
def debug_tesseract():
    print("Tesseract CMD Path:", pytesseract.pytesseract.tesseract_cmd)
    print("TESSDATA_PREFIX:", os.environ.get('TESSDATA_PREFIX'))
    print("Archivos en tessdata:", os.listdir(os.environ['TESSDATA_PREFIX']))

def test_tesseract():
    try:
        test_image = Image.new('RGB', (100, 100))
        text = pytesseract.image_to_string(test_image, lang='eng')
        print("Prueba de Tesseract exitosa:", text)
    except Exception as e:
        print("Error en la configuración de Tesseract:", e)

if __name__ == "__main__":
    debug_tesseract()
    test_tesseract()