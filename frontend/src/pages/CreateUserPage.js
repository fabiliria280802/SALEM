import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import React, { useState, useRef } from 'react';
import styles from '../styles/EditUserPage.module.css';
import userService from '../services/userService';
import { useHistory } from 'react-router-dom';
import { Toast } from 'primereact/toast';

const CreateUserPage = () => {
	const history = useHistory();
	const toast = useRef(null);

	const [userData, setUserData] = useState({
		name: '',
		last_name: '',
		phone: '',
		company_name: '',
		ruc: '',
		email: '',
		role: '',
	});

	const roleOptions = [
		{ label: 'Proveedor', value: 'Proveedor' },
		{ label: 'Gestor', value: 'Gestor' },
		{ label: 'Administrador', value: 'Administrador' },
	];

	const handleInputChange = e => {
		const { name, value } = e.target;
		setUserData({ ...userData, [name]: value });
	};

	const handleDropdownChange = e => {
		setUserData({ ...userData, role: e.value });
	};

	const handleSubmit = async () => {
		try {
			await userService.createUser(userData);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Usuario creado correctamente',
				life: 5000,
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

	return (
		<div className={styles.container}>
			<Toast ref={toast} />
			<div className={styles.formContainer}>
				<h1 className={styles.formTitle}>Crear usuario</h1>

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

export default CreateUserPage;
