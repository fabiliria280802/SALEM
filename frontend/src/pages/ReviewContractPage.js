import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import LoadingScreen from '../components/Layout/LoadingScreen';
import styles from '../styles/DocumentReviewPage.module.css';
import useAuth from '../hooks/useAuth';

const ReviewContractPage = () => {
	const [documentData, setDocumentData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [filePath, setFilePath] = useState('');
	const toast = useRef(null);
	const history = useHistory();
	const { id } = useParams();
	const { user } = useAuth();

	const loadDocument = useCallback(async () => {
		try {
			const response = await documentService.getDocumentById('Contract', id);
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
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al cargar el documento.',
			});
		} finally {
			setLoading(false); // Desactiva la pantalla de carga después del proceso
		}
	}, [id]);

	useEffect(() => {
		loadDocument();
	}, [loadDocument]);

	const handleApprove = async () => {
		try {
			const updateData = {
				status: 'Aceptado', // Solo se envía el status
				ai_decision_explanation: documentData.ai_decision_explanation,
			};

			await documentService.updateDocument('Contract', id, updateData);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Documento aprobado',
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

	const handleGoToDocuments = () => history.push('/documents');

	const handleGoBack = () => {
		history.push(`/upload-contract/${id}`);
	};

	if (loading) return <LoadingScreen />; // Muestra la pantalla de carga mientras loading es true
	if (!documentData) return <div>No se encontraron datos del contrato.</div>;

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.leftColumn}>
				<h1 className={styles.title}>Resultado del análisis</h1>
				<div className={styles.card}>
					<p className={styles.cardHeader}>Información del contrato:</p>
					<p className={styles.cardContent}>
						RUC: {documentData.provider_ruc || 'No disponible'}
						<br />
						Contrato: {documentData.contract_number || 'No disponible'}
						<br />
						Tipo de documento: {documentData.contract_type || 'No disponible'}
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
						<>
							<Button
								label="Cargar acta de recepción"
								className={styles.button}
								onClick={() =>
									history.push(
										`/upload-service-record?contractId=${documentData._id}`,
									)
								}
							/>
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

export default ReviewContractPage;
