import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import documentService from '../services/documentService';
import styles from '../styles/DocumentReviewPage.module.css';

const ReviewServiceRecordPage = () => {
	const [documentData, setDocumentData] = useState(null);
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
			const response = await documentService.getServiceRecordById(id);
			setDocumentData(response.data);
			setFileType(response.data.file_path.split('.').pop().toLowerCase());
			setFilePath(response.data.file_path);
		} catch (error) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al cargar el documento',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async () => {
		try {
			await documentService.updateDocument(id, 'ServiceDeliveryRecord', {
				status: 'Accepted',
			});
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Documento aprobado',
			});
			history.push(`/upload-invoice/${id}`);
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

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.leftColumn}>
				<h1 className={styles.title}>Resultado del análisis</h1>
				<p className={styles.info}>
					RUC: {documentData.ruc}
					<br />
					Contrato: {documentData.contrato}
					<br />
					Tipo de documento: {documentData.tipoDocumento}
					<br />
					Archivo: {documentData.file_path}
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
								: styles.accepted
						}
					>
						{documentData.status}
					</span>
				</p>
				<Button
					label="Aprobar"
					className={styles.button}
					onClick={handleApprove}
					disabled={documentData.status === 'Denegado'}
				/>
				<Button
					label="Solicitar revalidación"
					className={styles.buttonReverse}
					onClick={handleRevalidate}
					disabled={documentData.status === 'Aceptado'}
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

export default ReviewServiceRecordPage;
