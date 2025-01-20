import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/EditUserPage.module.css';
import documentService from '../services/documentService';
import publicService from '../services/publicService';
import { Toast } from 'primereact/toast';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingScreen from '../components/Layout/LoadingScreen';

const UploadContractPage = () => {
    const history = useHistory();
    const toast = useRef(null);
    const { user } = useAuth();
    const [documentData, setDocumentData] = useState({
        ruc: '',
        contract: '',
        documentType: 'Contract',
        file: null,
    });
    const [isRucReadOnly, setIsRucReadOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user && user.role === 'Proveedor') {
            setDocumentData(prev => ({ ...prev, ruc: user.ruc }));
            setIsRucReadOnly(true);
        }
    }, [user]);

    const handleInputChange = e => {
        const { name, value } = e.target;
        setDocumentData({ ...documentData, [name]: value });
    };

    const handleFileChange = e => {
        const file = e.target.files[0];
        if (file) {
            const fileSizeMB = file.size / (1024 * 1024);
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if ((fileExtension === 'pdf' || fileExtension === 'xml') && fileSizeMB <= 50) {
                setDocumentData({ ...documentData, file });
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Solo se permiten archivos PDF o XML de hasta 50 MB',
                    life: 5000,
                });
            }
        }
    };

    const handleSubmit = async e => {
        e.preventDefault();

        if (!documentData.ruc || !documentData.contract || !documentData.file) {
            toast.current.show({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe llenar todos los campos del formulario',
                life: 3000,
            });
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('documentType', documentData.documentType);
        formData.append('file', documentData.file);
        formData.append('ruc', documentData.ruc);
        formData.append('contract', documentData.contract);

        try {
            const response = await documentService.uploadDocument(documentData.documentType, formData);

            if (response._id) {
                history.push(`/review-contract/${response._id}`);
            } else {
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo obtener el ID del contrato. Intente nuevamente.',
                    life: 5000,
                });
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error en handleSubmit:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Error al cargar el contrato',
                life: 10000,
            });
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        history.push('/');
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className={styles.container}>
            <Toast ref={toast} />
            <div className={styles.formContainer}>
                <h1 className={styles.formTitle}>Nuevo contrato</h1>
                <p className={styles.formSubtitle}>Completa la información</p>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label htmlFor="ruc">RUC:</label>
                        <InputText
                            id="ruc"
                            name="ruc"
                            value={documentData.ruc}
                            onChange={handleInputChange}
                            maxLength={13}
                            disabled={isRucReadOnly}
                            placeholder={isRucReadOnly ? '' : 'Ingrese el RUC del proveedor'}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="contract">Contrato:</label>
                        <InputText
                            id="contract"
                            name="contract"
                            value={documentData.contract}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="file">Cargar archivo (PDF o XML):</label>
                        <InputText
                            type="file"
                            id="file"
                            name="file"
                            onChange={handleFileChange}
                            accept=".pdf,.xml"
                        />
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

export default UploadContractPage;
