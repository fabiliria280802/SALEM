import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import styles from '../styles/DocumentReviewPage.module.css';
import useAuth from '../hooks/useAuth';

const ReviewServiceRecordPage = () => {
	const [documentData, setDocumentData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [filePath, setFilePath] = useState('');
	const toast = useRef(null);
	const history = useHistory();
	const { id } = useParams();
	const { user } = useAuth();

	const loadDocument = useCallback(async () => {
		try {
			const response = await documentService.getDocumentById(
				'ServiceDeliveryRecord',
				id,
			);
			if (response) {
				setDocumentData(response);
				if (response.file_path) {
					const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost';
					const port = process.env.REACT_APP_API_PORT || '5000';
					setFilePath(`${baseUrl}:${port}/${response.file_path}`);
				} else {
					throw new Error('El archivo no tiene una ruta válida.');
				}
			} else {
				throw new Error('No se encontraron datos del acta de servicio.');
			}
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al cargar el documento.',
			});
		} finally {
			setLoading(false);
		}
	}, [id]);

	useEffect(() => {
		loadDocument();
	}, [loadDocument]);

	const handleApprove = async () => {
		try {
			const updateData = {
				status: 'Aceptado',
				ai_decision_explanation: documentData.ai_decision_explanation,
			};
			await documentService.updateDocument(
				'ServiceDeliveryRecord',
				id,
				updateData,
			);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Documento aprobado.',
			});
			history.push(`/documents`);
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al aprobar el documento.',
			});
		}
	};

	const handleCancel = () => history.push('/documents');
	const handleRevalidate = async () => {
		try {
			await documentService.requestRevalidation(id);
			await loadDocument();
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al solicitar revalidación.',
			});
		}
	};

	const handleBack = () => {
		history.push(`/upload-service-record/${id}`);
	};

	if (loading) return <div>Cargando...</div>;
	if (!documentData)
		return <div>No se encontraron datos del acta de servicio.</div>;

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.leftColumn}>
				<h1 className={styles.title}>Resultado del análisis</h1>
				<div className={styles.card}>
					<p className={styles.cardHeader}>Información del acta de servicio:</p>
					<p className={styles.cardContent}>
						HES: {documentData.hes_number || 'No disponible'}
						<br />
						Contrato: {documentData.contract_number || 'No disponible'}
						<br />
						Orden: {documentData.order_number || 'No disponible'}
						<br />
						Factura N°: {documentData.invoice_number || 'No disponible'}
						<br />
						Tipo de documento: Acta de recepción de servicio
					</p>
				</div>
				<div
					className={
						documentData.status === 'Aceptado'
							? styles.cardSuccess
							: styles.cardError
					}
				>
					<p className={styles.cardHeader}>
						{documentData.status === 'Aceptado'
							? 'Descripción del proceso:'
							: 'Descripción del error:'}
					</p>
					<p className={styles.cardContent}>
						<div
							dangerouslySetInnerHTML={{
								__html: documentData.ai_decision_explanation,
							}}
						/>
					</p>
				</div>
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
				<div className={styles.buttonGroup}>
					{documentData.status === 'Aceptado' && (
						<Button
							label="Cargar factura"
							className={styles.button}
							onClick={() =>
								history.push(`/upload-invoice?contract=${documentData._id}`)
							}
						/>
					)}
					{documentData.status === 'Denegado' &&
						user.role === 'Administrador' && (
							<Button
								label="Aprobar (Administrador y gestor)"
								className={styles.button}
								onClick={handleApprove}
							/>
						)}
					{documentData.status === 'Denegado' && user.role === 'Proveedor' && (
						<>
							<Button
								label="Solicitar validación manual"
								className={styles.buttonReverse}
								onClick={handleRevalidate}
							/>
							<Button
								label="Cargar otro documento"
								className={styles.buttonReverse}
								onClick={handleBack}
							/>
						</>
					)}
					<Button
						label="Guardar y salir"
						className={styles.buttonReverse}
						onClick={handleCancel}
					/>
					<Button
						label="Cargar otro documento"
						className={styles.buttonReverse}
						onClick={handleBack}
					/>
				</div>
			</div>
			<div className={styles.rightColumn}>
				{filePath ? (
					<Worker workerUrl="/pdfjs/pdf.worker.min.js">
						<Viewer fileUrl={filePath} />
					</Worker>
				) : (
					<p>
						No se puede cargar el archivo. Verifique que la ruta sea válida.
					</p>
				)}
			</div>
		</div>
	);
};

export default ReviewServiceRecordPage;
