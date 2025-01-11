import torch
import os
import json
import sys

from process import process_single_document
from model import DocumentDataset
from model import train_single_fold
from config import debug_tesseract, test_tesseract

if __name__ == "__main__":
    debug_tesseract()
    test_tesseract()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if len(sys.argv) == 5:
        file_path = sys.argv[1]
        document_type = sys.argv[2]
        ruc_input = sys.argv[3]
        auxiliar_input = sys.argv[4]
        result = process_single_document(file_path, document_type, ruc_input, auxiliar_input )
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        learning_dir = os.path.join(os.path.dirname(__file__), 'learning')
        os.makedirs(learning_dir, exist_ok=True)

        data_dir = os.path.join(os.path.dirname(__file__), 'data', 'train')
        current_fold = 1

        while True:
            try:
                for doc_type in ["Invoice", "ServiceDeliveryRecord", "Contract"]:
                    model_path = os.path.join(learning_dir, f'model_fold_{doc_type.lower()}{current_fold}.pth')

                    if os.path.exists(model_path):
                        print(f"Modelo {doc_type} para fold {current_fold} ya existe, saltando...")
                        continue

                    print(f"\nIniciando entrenamiento para {doc_type} - Fold {current_fold}")

                    dataset_path = os.path.join(data_dir, doc_type.lower())

                    valid_files = []
                    for root, dirs, files in os.walk(dataset_path):
                        for file in files:
                            if doc_type == "Invoice" and file.startswith("invoice_") and file.endswith((".pdf", ".png", ".xml")):
                                valid_files.append(os.path.join(root, file))
                            elif doc_type == "ServiceDeliveryRecord" and file.startswith("delivery_") and file.endswith((".pdf", ".png", ".xml")):
                                valid_files.append(os.path.join(root, file))
                            elif doc_type == "Contract" and file.startswith("contract_") and file.endswith((".pdf", ".xml")):
                                valid_files.append(os.path.join(root, file))

                    if not valid_files:
                        raise ValueError(f"No se encontraron archivos válidos para {doc_type} en {dataset_path}")

                    print(f"Cargando {len(valid_files)} documentos desde: {dataset_path}")
                    dataset = DocumentDataset(file_paths=valid_files, document_type=doc_type)

                    print(f"Iniciando entrenamiento con {len(dataset)} documentos de tipo {doc_type}")
                    train_single_fold(dataset, learning_dir, doc_type, current_fold, device)

                print(f"\nFold {current_fold} completado para todos los tipos de documentos!")
                response = input("\n¿Desea continuar con otro fold? (s/n): ").lower()
                if response not in ['s', 'si', 'yes', 'y']:
                    print("Entrenamiento detenido por el usuario")
                    break
                current_fold += 1

            except Exception as e:
                print(f"Error durante el entrenamiento: {str(e)}")
                break

        print("\nEntrenamiento finalizado!")
