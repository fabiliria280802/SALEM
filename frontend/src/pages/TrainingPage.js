import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import React, { useState, useRef } from 'react';
import styles from '../styles/EditUserPage.module.css';
import documentService from '../services/documentService';
import { Toast } from 'primereact/toast';
import { useHistory } from 'react-router-dom';

const TrainingPage = () => {
    const history = useHistory();
    const toast = useRef(null);
    const [documentData, setDocumentData] = useState({
        ruc: '',
        contract: '',
        documentType: '',
    });
    const [files, setFiles] = useState([]); // Nueva lista para manejar múltiples archivos

    const documentTypeOptions = [
        { label: 'Factura', value: 'Invoice' },
        { label: 'HES', value: 'HES' },
        { label: 'MIGO', value: 'MIGO' },
    ];

    const handleInputChange = e => {
        const { name, value } = e.target;
        setDocumentData({ ...documentData, [name]: value });
    };

    const handleFileChange = e => {
        const selectedFiles = Array.from(e.target.files); // Convierte a un arreglo de archivos
        const validFiles = selectedFiles.filter(file => {
            const fileSizeMB = file.size / (1024 * 1024);
            const fileExtension = file.name.split('.').pop().toLowerCase();
            return (
                (fileExtension === 'pdf' || fileExtension === 'png' || fileExtension === 'jpg') &&
                fileSizeMB <= 50
            );
        });

        if (validFiles.length + files.length > 10) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No puedes cargar más de 10 archivos',
                life: 5000,
            });
        } else if (validFiles.length + files.length < 5) {
            toast.current.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debes cargar al menos 5 archivos',
                life: 5000,
            });
        } else {
            setFiles(prevFiles => [...prevFiles, ...validFiles]); // Agrega los archivos válidos
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const { documentType } = documentData;

        if (!documentType || files.length < 5 || files.length > 10) {
            toast.current.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe llenar todos los campos del formulario y cargar entre 5 y 10 archivos',
                life: 3000,
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('documentType', documentType);
            files.forEach(file => formData.append('files', file)); // Añade los archivos

            await documentService.addADocument(formData);
            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documentos cargados correctamente',
                life: 5000,
            });
            setTimeout(() => history.push('/document-analizer'), 2000);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar los documentos',
                life: 10000,
            });
        }
    };

    const handleCancel = () => {
        history.push('/');
    };

    return (
        <div className={styles.container}>
            <Toast ref={toast} />
            <div className={styles.formContainer}>
                <h1 className={styles.formTitle}>Mejorar modelo IA</h1>
                <p className={styles.formSubtitle}>Completa la información</p>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="documentType">Tipo de documento:</label>
                        <Dropdown
                            id="documentType"
                            value={documentData.documentType}
                            options={documentTypeOptions}
                            onChange={e =>
                                setDocumentData({ ...documentData, documentType: e.value })
                            }
                            placeholder="Seleccionar tipo de documento"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="file">Cargar archivos:</label>
                        <InputText
                            type="file"
                            id="file"
                            name="file"
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.jpg,.png"
                        />
                        <p>{files.length} archivos seleccionados</p>
                    </div>
                </div>

                <div className={styles.buttonContainer}>
                    <Button
                        label="Cargar"
                        className={styles.saveButton}
                        onClick={handleSubmit}
                    />
                    <Button
                        label="Cancelar"
                        className={styles.cancelButton}
                        onClick={handleCancel}
                    />
                </div>
            </div>
        </div>
    );
};

export default TrainingPage;
