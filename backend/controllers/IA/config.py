import os
import re
import pytesseract
from PIL import Image
from dotenv import load_dotenv
import warnings

# Ignorar advertencias innecesarias
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

CONFIG = {
    "TESSERACT_PATH": "/usr/bin/tesseract",  
    "TRAINING_DATA_PATH": "./data/training",
    "MODEL_SAVE_PATH": "./models/",
    "TRAINING_DATA_PATH": "./data",   
    "MODEL_SAVE_PATH": "./learning" 
}

CLASS_NAMES = [
    "contract", 
    "invoice", 
    "service_delivery_record"]

# Configurar Tesseract
load_dotenv()
pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD')
os.environ['TESSDATA_PREFIX'] = os.getenv('TESSDATA_PREFIX')
