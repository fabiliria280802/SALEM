import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/EditUserPage.module.css';
import documentService from '../services/documentService';
import publicService from '../services/publicService';
import { Toast } from 'primereact/toast';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';
import LoadingScreen from '../components/Layout/LoadingScreen';

const UploadServiceDeliveryRecordPage = () => {
	const history = useHistory();
	const toast = useRef(null);
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const contractId = queryParams.get('contractId');
	const providerRuc = queryParams.get('ruc');
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	const [documentData, setDocumentData] = useState({
		hes: '',
		documentType: 'ServiceDeliveryRecord',
		file: null,
		contractId: '',
		ruc: '',
	});

	const [isRucReadOnly, setIsRucReadOnly] = useState(false);

	useEffect(() => {
		if (providerRuc) {
			setIsRucReadOnly(true);
			setDocumentData(prev => ({ ...prev, ruc: providerRuc || '' }));
		} else if (
			user &&
			(user.role === 'Gestor' || user.role === 'Administrador')
		) {
			setIsRucReadOnly(false);
		} else if (user && user.role === 'Proveedor') {
			setDocumentData(prev => ({ ...prev, ruc: user.ruc }));
			setIsRucReadOnly(true);
		}
		if (contractId) {
			setDocumentData(prev => ({ ...prev, contractId }));
		}
	}, [user, providerRuc, contractId]);

	const handleInputChange = e => {
		const { name, value } = e.target;
		setDocumentData({ ...documentData, [name]: value });
	};

	const handleFileChange = e => {
		const file = e.target.files[0];
		if (file) {
			const fileSizeMB = file.size / (1024 * 1024);
			const fileExtension = file.name.split('.').pop().toLowerCase();

			if (
				(fileExtension === 'pdf' ||
					fileExtension === 'xml' ||
					fileExtension === 'png') &&
				fileSizeMB <= 50
			) {
				setDocumentData({ ...documentData, file });
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'Solo se permiten archivos PDF, XML o PNG de hasta 50 MB',
					life: 5000,
				});
			}
		}
	};

	const handleRucBlur = async () => {
		if (user.role !== 'Proveedor' && documentData.ruc?.trim().length === 13) {
			try {
				const rucUser = await publicService.getUserByRuc(documentData.ruc);
				if (rucUser) {
					if (rucUser.role !== 'Proveedor') {
						toast.current.show({
							severity: 'error',
							summary: 'Error',
							detail: 'El RUC debe pertenecer a un usuario proveedor',
							life: 5000,
						});
						setDocumentData(prev => ({ ...prev, ruc: '' }));
					} else {
						toast.current.show({
							severity: 'success',
							summary: 'RUC Válido',
							detail: `Proveedor: ${rucUser.name} ${rucUser.last_name}`,
							life: 3000,
						});
					}
				}
			} catch (error) {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'El RUC no está registrado o no pertenece a un proveedor',
					life: 5000,
				});
				setDocumentData(prev => ({ ...prev, ruc: '' }));
			}
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		const formData = new FormData();
		formData.append('documentType', documentData.documentType);
		formData.append('file', documentData.file);
		formData.append('ruc', documentData.ruc);
		formData.append('hes', documentData.hes);
		formData.append('contractId', contractId);
	
		if (!documentData.ruc || !contractId || !documentData.file) {
			toast.current.show({
				severity: 'warn',
				summary: 'Advertencia',
				detail: 'Debe llenar todos los campos del formulario',
				life: 3000,
			});
			return;
		}
	
		setIsLoading(true);
		try {
			const response = await documentService.uploadDocument(
				documentData.documentType,
				formData
			);
	
			if (response._id) {
				history.push(`/review-service-record/${response._id}`);
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'No se pudo obtener el ID del documento. Intente nuevamente.',
					life: 5000,
				});
			}
		} catch (error) {
			console.error('Error en handleSubmit:', error);
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: error.message || 'Error al cargar el documento',
				life: 10000,
			});
		}
	};

	const handleCancel = () => {
		history.push(`/review-contract/${contractId}`);
	};

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.formContainer}>
				<h1 className={styles.formTitle}>
					Nueva acta de recepción de servicio
				</h1>
				<p className={styles.formSubtitle}>Completa la información</p>

				<div className={styles.formGrid}>
					<div className={styles.formGroup}>
						<label htmlFor="ruc">RUC:</label>
						<InputText
							id="ruc"
							name="ruc"
							value={documentData.ruc}
							onChange={handleInputChange}
							onBlur={handleRucBlur}
							maxLength={13}
							disabled={isRucReadOnly}
							placeholder={isRucReadOnly ? '' : 'Ingrese el RUC del proveedor'}
						/>
					</div>
					<div className={styles.formGroup}>
						<label htmlFor="hes">HES:</label>
						<InputText
							id="hes"
							name="hes"
							value={documentData.hes}
							onChange={handleInputChange}
						/>
					</div>
					<div className={styles.formGroup}>
						<label htmlFor="file">Cargar archivo (PDF):</label>
						<InputText
							type="file"
							id="file"
							name="file"
							onChange={handleFileChange}
							accept=".pdf,.xml,.png"
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

export default UploadServiceDeliveryRecordPage;
