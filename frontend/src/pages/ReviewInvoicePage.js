import React, { useState, useEffect, useRef,useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import LoadingScreen from '../components/Layout/LoadingScreen';
import styles from '../styles/DocumentReviewPage.module.css';
import useAuth from '../hooks/useAuth';
import axios from 'axios';

const ReviewInvoicePage = () => {
	const [documentData, setDocumentData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [filePath, setFilePath] = useState('');
	const toast = useRef(null);
	const history = useHistory();
	const { id } = useParams();
	const { user } = useAuth();


	const loadDocument = useCallback(async () => {
		try {
			const response = await documentService.getDocumentById('Invoice', id);
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
				throw new Error('No se encontraron datos del contrato.');
			}
		} catch (error) {
			if (toast.current) {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'Error al cargar el documento.',
				});
			}
		} finally {
			setLoading(false); // Desactiva la pantalla de carga después del proceso
		}
	}, [id]);
	
	useEffect(() => {
		loadDocument();
		if (toast.current) {
			console.log('Toast está inicializado');
		}
	}, [loadDocument]);

	const handleApprove = async () => {
		try {
			const updateData = {
				status: 'Aceptado', // Solo se envía el status
				ai_decision_explanation: documentData.ai_decision_explanation,
			};
			await documentService.updateDocument('Invoice', id, updateData);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Documento aprobado',
			});
			history.push('/documents'); // Redirige a DocumentListPage
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al aprobar el documento',
			});
		}
	};

	const handleRevalidate = async () => {
		try {
			await documentService.notifyManagers(id);
			toast.current.show({
				severity: 'info',
				summary: 'Información',
				detail: 'Se ha notificado a los gestores para una validación manual',
				life: 5000,
			});
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al notificar a los gestores',
			});
		}
	};

	const handleGoBack = () => {
		history.push(`/upload-invoice/${id}`);
	};

	const handleGoToDocuments = () => history.push('/documents');
	if (loading) return <LoadingScreen />;
	if (!documentData) return <div>No se encontraron datos del contrato.</div>;

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.leftColumn}>
				<h1 className={styles.title}>Resultado del análisis</h1>
				<p className={styles.info}>
					Compañia: {documentData.issuing_company}
					<br />
					Fecha: {documentData.issue_date}
					<br />
					Tipo de documento: Factura
					<br />
					Archivo: {documentData.file_path}
				</p>

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
						<>
							<Button
								label="Guardar y salir"
								className={styles.buttonReverse}
								onClick={handleGoToDocuments}
							/>
						</>
					)}
					{documentData.status === 'Denegado' && (
						<>
							{user.role === 'Administrador' && (
								<Button
									label="Aprobar"
									className={styles.button}
									onClick={handleApprove}
								/>
							)}
							{user.role === 'Proveedor' && (
								<>
									<Button
										label="Solicitar validación manual"
										className={styles.buttonReverse}
										onClick={handleRevalidate}
									/>
									<Button
										label="Cargar otro documento"
										className={styles.buttonReverse}
										onClick={handleGoBack}
									/>
								</>
							)}
							<Button
								label="Guardar y salir"
								className={styles.buttonReverse}
								onClick={handleGoToDocuments}
							/>
						</>
					)}
					<Button
						label="Cargar otro documento"
						className={styles.buttonReverse}
						onClick={handleGoBack}
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

export default ReviewInvoicePage;
