import React, { useEffect, useState, useRef } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import styles from '../styles/EditUserPage.module.css';
import { useHistory } from 'react-router-dom';
import { Toast } from 'primereact/toast';

const UserAccountPage = () => {
	const history = useHistory();
	const toast = useRef(null);
	const [userId, setUserId] = useState(null);
	const [userData, setUserData] = useState({
		name: '',
		last_name: '',
		email: '',
		phone: '',
		ruc: '',
		company_name: '',
		role: '',
		password: '',
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
				const decodedToken = authService.decodeToken(token);
				setUserId(decodedToken.id);
				const userData = await userService.getAUser(decodedToken.id);
				setUserData(userData);
			} catch (err) {
				setError('Error al cargar los datos del usuario');
			} finally {
				setLoading(false);
			}
		};

		fetchUser();
	}, []);

	const handleInputChange = e => {
		const { name, value } = e.target;
		setUserData({ ...userData, [name]: value });
	};

	const handleDropdownChange = e => {
		setUserData({ ...userData, role: e.value });
	};

	const handleSave = async () => {
		try {
			await userService.updateUser(userId, userData); // Pasa el userId y userData correctamente
			toast.current.show({
				severity: 'success',
				summary: 'Actualización exitosa',
				detail: 'La información se actualizó correctamente',
				life: 3000,
			});
		} catch (err) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'No se pudo actualizar la información',
				life: 3000,
			});
		}
	};

	const handleCancel = () => {
		history.goBack();
	};

	const handleResetPassword = () => {
		history.push(`/create-password?userId=${userId}`);
	};

	if (loading) {
		return <div>Cargando...</div>;
	}

	if (error) {
		return <div>{error}</div>;
	}

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.formContainer}>
				<h1 className={styles.formTitle}>Mi cuenta</h1>
				<p>Empresa: {userData.company_name}</p>
				<div className={styles.formGrid}>
					<div className={styles.formGroup}>
						<label htmlFor="name">Nombre:</label>
						<InputText
							id="name"
							name="name"
							value={userData.name}
							onChange={handleInputChange}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="last_name">Apellido:</label>
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
							disabled
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="phone">Teléfono:</label>
						<InputText
							id="phone"
							name="phone"
							value={userData.phone}
							onChange={handleInputChange}
							disabled
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="ruc">RUC:</label>
						<InputText
							id="ruc"
							name="ruc"
							value={userData.ruc}
							onChange={handleInputChange}
							disabled
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="role">Permisos:</label>
						<Dropdown
							id="role"
							value={userData.role}
							options={roleOptions}
							onChange={handleDropdownChange}
							placeholder="Seleccionar permiso"
							disabled
						/>
					</div>
				</div>
				<p>
					{' '}
					* Si deseas actualizar la información de tu perfil, específicamente
					correo y/o teléfono, comunícate con el{' '}
					<a href="mailto:mateo.avila@udla.edu.ec">administrador</a>.
				</p>
				<div className={styles.userAccountButtonContainer}>
					<Button
						label="Actualizar"
						className={styles.saveButton}
						onClick={handleSave}
					/>
					<Button
						label="Regresar"
						className={styles.cancelButton}
						onClick={handleCancel}
					/>
					<Button
						label="Restablecer Contraseña"
						className={styles.resetButton}
						onClick={handleResetPassword}
					/>
				</div>
			</div>
		</div>
	);
};

export default UserAccountPage;
