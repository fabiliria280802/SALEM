import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import styles from '../styles/UsersManagementPage.module.css';
import documentService from '../services/documentService';
import { Toast } from 'primereact/toast';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';

const DocumentsListPage = () => {
	const history = useHistory();
	const { user } = useAuth();
	const [documents, setDocuments] = useState([]);
	const [filteredDocuments, setFilteredDocuments] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [appliedFilters, setAppliedFilters] = useState([]);
	const toast = useRef(null);

	const fieldMap = {
		ruc: 'ruc',
		contrato: 'contrato',
		tipo: 'tipoDocumento',
		estado: 'status',
		fecha: 'created_at',
	};

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				const response = await documentService.getDocumentsList();
				// Asegurarse de que data sea un array
				const data = Array.isArray(response.data) ? response.data : response;

				// Filtrar documentos según el rol
				const filteredData =
					user.role === 'Proveedor'
						? data.filter(doc => doc.ruc === user.ruc)
						: data;

				console.log('Documentos cargados:', filteredData); // Para debugging

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
				// Inicializar con array vacío en caso de error
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
			await documentService.requestRevalidation(documentId);
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
		} catch (error) {
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
					<i className="pi pi-search" onClick={handleSearch} />
					<input
						type="text"
						value={searchTerm}
						onKeyDown={handleSearchKeyDown}
						onChange={e => setSearchTerm(e.target.value)}
						className={styles.searchInput}
						placeholder="Ejemplo: ruc:1234567890001"
					/>
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
							<th>Fecha</th>
							<th>Estado</th>
							<th>Explicación IA</th>
							<th>Control</th>
						</tr>
					</thead>
					<tbody>
						{filteredDocuments.map(doc => (
							<tr key={doc._id}>
								<td>{doc.ruc}</td>
								<td>{doc.contrato}</td>
								<td>{doc.tipoDocumento}</td>
								<td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</td>
								<td>{doc.status}</td>
								<td>{doc.ai_decision_explanation}</td>
								<td>
									{user.role === 'Proveedor' && doc.status === 'Denegado' && (
										<button
											className={styles.revalidateButton}
											onClick={() => handleRequestRevalidation(doc._id)}
										>
											Solicitar Revalidación
										</button>
									)}
									{(user.role === 'Administrador' ||
										user.role === 'Gestor') && (
										<button
											className={styles.viewButton}
											onClick={() => history.push(`/document/${doc._id}`)}
										>
											Ver Detalles
										</button>
									)}
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
