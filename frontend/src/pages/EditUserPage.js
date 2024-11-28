import React, { useEffect, useState, useRef } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import styles from '../styles/EditUserPage.module.css';
import { useHistory, useParams } from 'react-router-dom';
import { Toast } from 'primereact/toast';

const EditUserPage = () => {
	const history = useHistory();
	const { id } = useParams();
	const toast = useRef(null); // Referencia para el Toast
	const [userData, setUserData] = useState({
		name: '',
		last_name: '',
		phone: '',
		company_name: '',
		ruc: '',
		email: '',
		role: '',
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const roleOptions = [
		{ label: 'Proveedor', value: 'Proveedor' },
		{ label: 'Gestor', value: 'Gestor' },
		{ label: 'Administrador', value: 'Administrador' },
	];

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const token = authService.getToken();
				if (!token) throw new Error('Token no disponible');
				const userData = await userService.getAUser(id);
				setUserData(userData);
			} catch (err) {
				setError('Error al cargar los datos del usuario');
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, [id]);

	const handleInputChange = e => {
		const { name, value } = e.target;
		setUserData({ ...userData, [name]: value });
	};

	const handleDropdownChange = e => {
		setUserData({ ...userData, role: e.value });
	};

	const handleSubmit = async () => {
		try {
			await userService.updateUser(id, userData);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Usuario actualizado correctamente.',
				life: 3000,
			});
			setTimeout(() => history.push('/users-management'), 2000);
		} catch (errors) {
			errors.forEach(err =>
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: err,
					life: 10000,
				}),
			);
		}
	};

	const handleCancel = () => {
		history.push('/users-management');
	};

	if (loading) {
		return <div>Cargando...</div>;
	}

	if (error) {
		return <div>{error}</div>;
	}

	return (
		<div className={styles.container}>
			<Toast ref={toast} /> {/* Componente Toast */}
			<div className={styles.formContainer}>
				<h1 className={styles.formTitle}>Editar usuario</h1>
				<div className={styles.formGrid}>
					<div className={styles.formGroup}>
						<label htmlFor="name">Nombres:</label>
						<InputText
							id="name"
							name="name"
							value={userData.name}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="last_name">Apellidos:</label>
						<InputText
							id="last_name"
							name="last_name"
							value={userData.last_name}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="email">Correo:</label>
						<InputText
							id="email"
							name="email"
							value={userData.email}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="phone">Teléfono:</label>
						<InputText
							id="phone"
							name="phone"
							value={userData.phone}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="ruc">RUC:</label>
						<InputText
							id="ruc"
							name="ruc"
							value={userData.ruc}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="company_name">Empresa:</label>
						<InputText
							id="company_name"
							name="company_name"
							value={userData.company_name}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="role">Rol:</label>
						<Dropdown
							id="role"
							value={userData.role}
							options={roleOptions}
							onChange={handleDropdownChange}
							placeholder="Seleccionar permiso"
						/>
					</div>
				</div>

				<div className={styles.buttonContainer}>
					<Button
						label="Guardar"
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

export default EditUserPage;
