import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/EditUserPage.module.css';
import documentService from '../services/documentService';
import publicService from '../services/publicService';
import { Toast } from 'primereact/toast';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const UploadContractPage = () => {
	const history = useHistory();
	const toast = useRef(null);
	const { user } = useAuth();
	const [documentData, setDocumentData] = useState({
		ruc: '',
		contract: '',
		documentType: 'Contract',
		file: null,
	});
	const [isRucReadOnly, setIsRucReadOnly] = useState(false);

	useEffect(() => {
		if (user && user.role === 'Proveedor') {
			setDocumentData(prev => ({ ...prev, ruc: user.ruc }));
			setIsRucReadOnly(true);
		}
	}, [user]);

	const handleInputChange = e => {
		const { name, value } = e.target;
		setDocumentData({ ...documentData, [name]: value });
	};

	const handleFileChange = e => {
		const file = e.target.files[0];
		if (file) {
			const fileSizeMB = file.size / (1024 * 1024);
			const fileExtension = file.name.split('.').pop().toLowerCase();

			if ((fileExtension === 'pdf' || fileExtension === 'xml') && fileSizeMB <= 50) {
				setDocumentData({ ...documentData, file });
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'Solo se permiten archivos PDF o XML de hasta 50 MB',
					life: 5000,
				});
			}
		}
	};

	const handleRucBlur = async () => {
		if (user.role !== 'Proveedor' && documentData.ruc.trim().length === 13) {
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

		// Crear FormData y agregar los campos
		const formData = new FormData();

		// Asegurarnos de que el tipo de documento se envíe primero
		formData.append('documentType', documentData.documentType);
		formData.append('file', documentData.file);
		formData.append('ruc', documentData.ruc);
		formData.append('contract', documentData.contract);

		// Debug para verificar que se está enviando correctamente
		console.log('DocumentType siendo enviado:', formData.get('documentType'));

		if (!documentData.ruc || !documentData.contract || !documentData.file) {
			toast.current.show({
				severity: 'warn',
				summary: 'Advertencia',
				detail: 'Debe llenar todos los campos del formulario',
				life: 3000,
			});
			return;
		}

		try {
			const response = await documentService.uploadDocument(documentData.documentType, formData);

			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Contrato cargado correctamente',
				life: 5000,
			});

			if (response._id) {
				setTimeout(
					() => history.push(`/review-contract/${response._id}`),
					2000,
				);
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'No se pudo obtener el ID del contrato. Intente nuevamente.',
					life: 5000,
				});
			}
		} catch (error) {
			console.error('Error en handleSubmit:', error);
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: error.message || 'Error al cargar el contrato',
				life: 10000,
			});
		}
	};

	const handleCancel = () => {
		history.push('/');
	};

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.formContainer}>
				<h1 className={styles.formTitle}>Nuevo contrato</h1>
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
						<label htmlFor="contract">Contrato:</label>
						<InputText
							id="contract"
							name="contract"
							value={documentData.contract}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="file">Cargar archivo (PDF o XML):</label>
						<InputText
							type="file"
							id="file"
							name="file"
							onChange={handleFileChange}
							accept=".pdf,.xml"
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

export default UploadContractPage;

