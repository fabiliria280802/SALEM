import { useState, useEffect } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { Toast } from 'primereact/toast';
import React from 'react';
import styles from '../styles/DocumentReviewPage.module.css';
import { useHistory, useLocation } from 'react-router-dom';

const DocumentReviewPage = () => {
	const [fileType, setFileType] = useState('pdf');
	const [filePath, setFilePath] = useState('');
	const [documentData, setDocumentData] = useState(null);
	const [validationFields, setValidationFields] = useState([]);
	const history = useHistory();
	const location = useLocation();

	useEffect(() => {
		if (location.state?.documentData) {
			const data = location.state.documentData;
			setDocumentData(data);
			setFilePath(data.file_path);

			switch (data.tipoDocumento) {
				case 'Invoice':
					setValidationFields([
						{ name: 'RUC', field: 'provider_ruc' },
						{ name: 'No. Factura', field: 'invoice_number' },
						{ name: 'Fecha de emisión', field: 'issue_date' },
						{ name: 'Nombre del proveedor', field: 'provider_name' },
						{ name: 'Subtotal', field: 'subtotal' },
						{ name: 'IVA', field: 'iva' },
						{ name: 'Total', field: 'total' },
					]);
					break;
				case 'HES':
					setValidationFields([
						{ name: 'Título', field: 'title' },
						{ name: 'Empresa receptora', field: 'receiving_company' },
						{ name: 'Número de orden', field: 'order_number' },
						{ name: 'Fecha inicio', field: 'start_date' },
						{ name: 'Fecha fin', field: 'end_date' },
						{ name: 'Ubicación del servicio', field: 'service_location' },
						{ name: 'Firmas', field: 'signatures' },
					]);
					break;
				case 'MIGO':
					setValidationFields([
						{ name: 'Título', field: 'title' },
						{ name: 'Número MIGO', field: 'migo_number' },
						{ name: 'Fecha', field: 'date' },
						{ name: 'Cliente', field: 'client' },
						{ name: 'Dirección', field: 'address' },
						{ name: 'Detalles de items', field: 'item_details' },
						{ name: 'Firma del cliente', field: 'client_signature' },
					]);
					break;
			}
		}
	}, [location]);

	const handleReview = () => {
		history.push('/dashboard');
	};

	if (!documentData) {
		return <div>Cargando...</div>;
	}

	return (
		<div className={styles.container}>
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
						{validationFields.map((field, index) => (
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
				<button className={styles.button} onClick={handleReview}>
					Ir a revisión
				</button>
				<button className={styles.buttonReverse}>Solicitar revalidación</button>
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

export default DocumentReviewPage;
