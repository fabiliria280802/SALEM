import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import styles from '../styles/UsersManagementPage.module.css';
import documentService from '../services/documentService';
import { Toast } from 'primereact/toast';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';
import axios from 'axios';

const DocumentsListPage = () => {
	const history = useHistory();
	const { user } = useAuth();
	const [documents, setDocuments] = useState([]);
	const [filteredDocuments, setFilteredDocuments] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [appliedFilters, setAppliedFilters] = useState([]);
	const toast = useRef(null);

	const fieldMap = {
		ruc: 'provider_ruc',
		contrato: 'contract_number',
		tipo: 'document_type',
		estado: 'status',
		fecha: 'created_at',
	};

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				const [contractsResponse, invoicesResponse, serviceRecordsResponse] =
					await Promise.all([
						documentService.getAllContracts(),
						documentService.getAllServiceDeliveryRecords(),
						documentService.getAllInvoices(),
					]);

				const combinedData = [
					...(Array.isArray(contractsResponse)
						? contractsResponse
						: contractsResponse.data || []),
					...(Array.isArray(invoicesResponse)
						? invoicesResponse
						: invoicesResponse.data || []),
					...(Array.isArray(serviceRecordsResponse)
						? serviceRecordsResponse
						: serviceRecordsResponse.data || []),
				];

				console.log('Datos combinados:', combinedData);

				const filteredData =
				user.role === 'Proveedor'
					? combinedData.filter(doc => doc.provider_ruc === user.ruc || doc.uploaded_by === user._id)
					: combinedData;
			

				setDocuments(filteredData);
				setFilteredDocuments(filteredData);
			} catch (error) {
				console.error('Error al cargar documentos:', error);
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'Error al cargar los documentos',
					life: 3000,
				});
				setDocuments([]);
				setFilteredDocuments([]);
			}
		};

		fetchDocuments();
	}, [user]);

	const handleSearch = () => {
		if (searchTerm.trim() !== '') {
			const [key, value] = searchTerm.split(':').map(str => str.trim());
			const mappedKey = fieldMap[key.toLowerCase()];

			if (mappedKey && value) {
				setAppliedFilters([...appliedFilters, { key: mappedKey, value }]);
				setSearchTerm('');
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error de Formato',
					detail: 'Use el formato "campo:valor" con un campo válido',
					life: 3000,
				});
			}
		}
	};

	const handleSearchKeyDown = e => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	useEffect(() => {
		const filtered = documents.filter(doc => {
			return appliedFilters.every(filter => {
				const { key, value } = filter;
				const docValue = doc[key]
					? doc[key].toString().toLowerCase().trim()
					: '';
				const filterValue = value.toLowerCase().trim();

				if (key === 'created_at') {
					const docDate = format(new Date(docValue), 'dd/MM/yyyy');
					return docDate.includes(filterValue);
				}

				return docValue.includes(filterValue);
			});
		});
		setFilteredDocuments(filtered);
	}, [appliedFilters, documents]);

	const handleRemoveFilter = filter => {
		const updatedFilters = appliedFilters.filter(
			item => item.key !== filter.key || item.value !== filter.value,
		);
		setAppliedFilters(updatedFilters);
	};

	const handleRequestRevalidation = async documentId => {
		try {
			const document = documents.find(doc => doc._id === documentId);
			if (!document) {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'Documento no encontrado',
					life: 3000,
				});
				return;
			}
	
			const response = await axios.post(
				`${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/mail/send-manual-review-notification`,
				{
					documentName: document.document_type,
					contractNumber: document.contract_number,
					senderName: user.name,
					companyName: user.company_name, 
				}
			);
	
			if (response.status === 200) {
				toast.current.show({
					severity: 'success',
					summary: 'Éxito',
					detail: 'Solicitud de revalidación enviada correctamente',
					life: 3000,
				});
	
				// Actualizar la lista de documentos
				const updatedDocs = documents.map(doc =>
					doc._id === documentId ? { ...doc, status: 'Revalidación' } : doc,
				);
				setDocuments(updatedDocs);
				setFilteredDocuments(updatedDocs);
			}
		} catch (error) {
			console.error('Error en la solicitud de revalidación:', error);
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Error al solicitar la revalidación',
				life: 3000,
			});
		}
	};

	const handleReturnClick = () => {
		history.push('/');
	};

	return (
		<div className={styles.usersManagementPage}>
			<Toast ref={toast} />
			<div className={styles.container}>
				<h1 className={styles.formTitle}>Lista de Documentos</h1>
				<p>
					<strong>Nota: </strong>Para filtrar escribe nombre_campo:valor y da
					click en la lupa o presiona la tecla Enter
				</p>
				<div className={styles.filterContainer}>
					<div className={styles.searchWrapper}>
						<i
							className={`pi pi-search ${styles.searchIcon}`}
							onClick={handleSearch}
						/>
						<input
							type="text"
							value={searchTerm}
							onKeyDown={handleSearchKeyDown}
							onChange={e => setSearchTerm(e.target.value)}
							className={styles.searchInput}
							placeholder="Ejemplo: ruc:1234567890001"
						/>
					</div>
					<div className={styles.appliedFiltersContainer}>
						{appliedFilters.map((filter, index) => (
							<span key={index} className={styles.filteredTag}>
								{`${Object.keys(fieldMap).find(key => fieldMap[key] === filter.key)}: ${filter.value}`}
								<span
									className={styles.clearButton}
									onClick={() => handleRemoveFilter(filter)}
								>
									✕
								</span>
							</span>
						))}
					</div>
				</div>

				<div className={styles.buttonContainer}>
					<button className={styles.exitButton} onClick={handleReturnClick}>
						Volver al menú principal
					</button>
				</div>

				<table className={styles.usersTable}>
					<thead>
						<tr>
							<th>RUC</th>
							<th>Contrato</th>
							<th>Tipo</th>
							<th>Fecha y Hora</th>
							<th>Estado</th>
							<th>Explicación IA</th>
							<th>Control</th>
						</tr>
					</thead>
					<tbody>
						{filteredDocuments.map(doc => (
							<tr key={doc._id}>
								<td>{doc.provider_ruc}</td>
								<td>{doc.contract_number}</td>
								<td>{doc.document_type}</td>
								<td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</td>
								<td
									className={
										doc.status === 'Aceptado'
											? styles.cardSuccess
											: styles.cardError
									}
								>
									{doc.status}
								</td>
								<td>
									{' '}
									<div
										dangerouslySetInnerHTML={{
											__html: doc.ai_decision_explanation,
										}}
									/>
								</td>
								<td>
									{user.role === 'Proveedor' && doc.status === 'Denegado' && (
										<button
											className={styles.revalidateButton}
											onClick={() => handleRequestRevalidation(doc._id)}
										>
											Solicitar Revalidación
										</button>
									)}
									<button
										className={styles.viewButton}
										onClick={() => {
											let route = '';
											switch (doc.document_type) {
												case 'Contrato':
													route = `/review-contract/${doc._id}`;
													break;
												case 'Factura':
													route = `/review-invoice/${doc._id}`;
													break;
												case 'Acta de entrega':
													route = `/review-service-record/${doc._id}`;
													break;
												default:
													route = '/';
											}
											history.push(route);
										}}
									>
										Ver Detalles
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default DocumentsListPage;
