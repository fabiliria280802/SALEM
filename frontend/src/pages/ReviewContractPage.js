import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import styles from '../styles/DocumentReviewPage.module.css';
import useAuth from '../hooks/useAuth';

const ReviewContractPage = () => {
	const [documentData, setDocumentData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [fileType, setFileType] = useState('pdf');
	const [filePath, setFilePath] = useState('');
	const toast = useRef(null);
	const history = useHistory();
	const { id } = useParams();
	const { user } = useAuth();

	useEffect(() => {
		loadDocument();
	}, [id]);

	const loadDocument = async () => {
		try {
			const response = await documentService.getDocumentById('Contract', id);
	
			if (response) {
				console.log('Datos del contrato:', response); // Depuración
				setDocumentData(response)
	
				// Asegúrate de que file_path esté definido y sea válido
				if (response.file_path) {
					const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost'; 
					const port = process.env.REACT_APP_API_PORT || '5000';
					setFilePath(`${baseUrl}:${port}/${response.file_path}`);
				} else {
					throw new Error('El archivo no tiene una ruta válida.');
				}
			} else {
				throw new Error('No se encontraron datos del contrato');
			}
		} catch (error) {
			console.error('Error al cargar el documento:', error);
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al cargar el documento',
			});
		} finally {
			setLoading(false);
		}
	};
	
	
	if (!documentData) {
		return <div>No se encontraron datos del contrato</div>; // Renderiza un mensaje de error o una alternativa
	}

	const handleApprove = async () => {
		try {
			await documentService.updateDocument(id, 'Contract', {
				status: 'Aceptado',
			});
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Documento aprobado',
			});
			history.push(`/upload-service-record`);
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al aprobar el documento',
			});
		}
	};

	const handleCancel = () => {
		history.push('/upload-contract');
	};

	const handleRevalidate = async () => {
		try {
			await documentService.requestRevalidation(id);
			await loadDocument();
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al solicitar revalidación',
			});
		}
	};

	const handleGoToDeliveryRecord = () => {
		history.push(`/upload-service-record?contractId=${documentData._id}&ruc=${documentData.provider_ruc}`);
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
                    RUC: {documentData?.provider_ruc || 'No disponible'}
                    <br />
                    Contrato: {documentData?.contract_number || 'No disponible'}
                    <br />
                    Tipo de documento: {documentData?.contract_type || 'No disponible'}
                    <br />
                    Archivo: {documentData?.file_path || 'No disponible'}
                </p>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.tableHeader}>Parámetro</th>
                            <th className={styles.tableHeader}>Cumple</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentData.validationFields?.map((field, index) => (
                            <tr key={index}>
                                <td className={styles.tableCell}>{field.name}</td>
                                <td className={styles.tableCell}>
                                    {documentData.validation_errors?.includes(field.field)
                                        ? 'No'
                                        : 'Sí'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p>
                    <strong>Descripción del error:</strong>{' '}
                    {documentData.ai_decision_explanation}
                </p>
                <p className={styles.status}>
                    Estado:{' '}
                    <span
                        className={
                            documentData.status === 'Denegado'
                                ? styles.denied
                                : styles.approved
                        }
                    >
                        {documentData.status}
                    </span>
                </p>
                {documentData.status === 'Denegado' &&
                    (user.role === 'Administrador' || user.role === 'Gestor') && (
                        <Button
                            label="Aprobar"
                            className={styles.button}
                            onClick={handleApprove}
                        />
                    )}
				{documentData.status === 'Denegado' && 
					(user.role === 'Proveedor') &&	(							
						<Button
							label="Cargar otro documento"
							className={styles.button}
							onClick={handleCancel}
						/>
				)}
                {documentData.status === 'Denegado' && (
                    <Button
                        label="Solicitar revalidación"
                        className={styles.buttonReverse}
                        onClick={handleRevalidate}
                    />
                )}
				{documentData.status === 'Denegado' && (								
					<Button
						label="Cargar otro documento"
						className={styles.button}
						onClick={handleCancel}
					/>
				)}
				{documentData.status === 'Aceptado' && (
					<Button
						label="Cargar una acta de recepción"
						className={styles.button}
						onClick={handleGoToDeliveryRecord}
					/>
				)}
            </div>

            <div className={styles.rightColumn}>
                {fileType === 'pdf' && filePath ? (
                    <Worker workerUrl="/pdfjs/pdf.worker.min.js">
                        <div style={{ height: '70vh', width: '100%', overflow: 'auto' }}>
                            <Viewer fileUrl={filePath} renderMode="canvas" />
                        </div>
                    </Worker>
                ) : (
                    <p>No se puede cargar el archivo. Verifique que la ruta sea válida.</p>
                )}
            </div>
        </div>
    );
};

export default ReviewContractPage;

