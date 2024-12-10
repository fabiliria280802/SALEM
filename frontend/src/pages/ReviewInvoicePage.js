import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import styles from '../styles/DocumentReviewPage.module.css';

const ReviewInvoicePage = () => {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fileType, setFileType] = useState('pdf');
    const [filePath, setFilePath] = useState('');
    const toast = useRef(null);
    const history = useHistory();
    const { id } = useParams();

    useEffect(() => {
        loadDocument();
    }, [id]);

    const loadDocument = async () => {
        try {
            const response = await documentService.getInvoiceById(id);
            setDocument(response.data);
            setFileType(response.data.file_path.split('.').pop().toLowerCase());
            setFilePath(response.data.file_path);
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar el documento'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        try {
            await documentService.updateDocument(id, 'Invoice', { status: 'Accepted' });
            toast.current.show({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Documento aprobado'
            });
            history.push('/documents'); // Redirige a DocumentListPage
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al aprobar el documento'
            });
        }
    };

    const handleRevalidationFailure = async () => {
        try {
            await documentService.notifyManagers(id);
            toast.current.show({
                severity: 'info',
                summary: 'Información',
                detail: 'Se ha notificado a los gestores para una validación manual',
                life: 5000
            });
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al notificar a los gestores'
            });
        }
    };

    if (loading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className={styles.container}>
            <Toast ref={toast} />
            <div className={styles.leftColumn}>
                <h1 className={styles.title}>Resultado del análisis</h1>
                <p className={styles.info}>
                    RUC: {document.ruc}<br />
                    Contrato: {document.contrato}<br />
                    Tipo de documento: {document.tipoDocumento}<br />
                    Archivo: {document.file_path}
                </p>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.tableHeader}>Parámetro</th>
                            <th className={styles.tableHeader}>Cumple</th>
                        </tr>
                    </thead>
                    <tbody>
                        {document.validationFields?.map((field, index) => (
                            <tr key={index}>
                                <td className={styles.tableCell}>{field.name}</td>
                                <td className={styles.tableCell}>
                                    {document.validation_errors?.includes(field.field) ? 'No' : 'Sí'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p><strong>Descripción del error:</strong> {document.ai_decision_explanation}</p>
                <p className={styles.status}>
                    Estado: <span className={document.status === 'Denegado' ? styles.denied : styles.accepted}>
                        {document.status}
                    </span>
                </p>
                <Button
                    label="Aprobar"
                    className={styles.button}
                    onClick={handleApprove}
                    disabled={document.status === 'Denegado'}
                />
                <Button
                    label="Solicitar revalidación"
                    className={styles.buttonReverse}
                    onClick={handleRevalidationFailure}
                    disabled={document.status === 'Aceptado'}
                />
            </div>

            <div className={styles.rightColumn}>
                {fileType === 'pdf' ? (
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <div style={{ height: '70vh', width: '100%', overflow: 'auto' }}>
                            <Viewer fileUrl={filePath} renderMode="canvas" />
                        </div>
                    </Worker>
                ) : (
                    <img
                        src={filePath}
                        alt="Preview del documento"
                        className={styles.preview}
                    />
                )}
            </div>
        </div>
    );
};

export default ReviewInvoicePage;