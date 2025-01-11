# ia.py
import argparse
import json
import os

from model import train_model, classify_document, load_model
from process import process_contract, process_invoice, process_service_delivery_record
from config import CONFIG

def main():
    parser = argparse.ArgumentParser(description='IA Core')
    parser.add_argument('--action', type=str, required=True, help='Accion a realizar: train | predict')
    parser.add_argument('--file_path', type=str, help='Ruta del archivo a procesar')
    args = parser.parse_args()

    if args.action == 'train':
        print(json.dumps({"status": "Training started"}))
        train_model()
        print(json.dumps({"status": "Training finished"}))

    elif args.action == 'predict':
        if not args.file_path:
            print(json.dumps({"error": "No se proporcionó file_path"}))
            return

        # 1. Clasificar (contrato, factura o acta)
        classification_result = classify_document(args.file_path)
        doc_type = classification_result["predicted_class"]
        confidence = classification_result["confidence"]

        # 2. Dependiendo del tipo, llamar a la lógica de extracción
        if doc_type == "contract":
            output_data = process_contract(args.file_path)
        elif doc_type == "invoice":
            output_data = process_invoice(args.file_path)
        elif doc_type == "service_delivery_record":
            output_data = process_service_delivery_record(args.file_path)
        else:
            output_data = {"error": "Tipo de documento desconocido"}

        # 3. Retornar la respuesta
        combined_response = {
            "classification": {
                "predicted_class": doc_type,
                "confidence": confidence
            },
            "extraction_result": output_data
        }
        print(json.dumps(combined_response))
    else:
        print(json.dumps({"error": "Acción no reconocida. Usa --action train o --action predict"}))

if __name__ == '__main__':
    main()
