import React, { useState, useRef } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import axios from 'axios';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import styles from '../styles/CreatePasswordPage.module.css';

const CreatePasswordPage = () => {
	const location = useLocation();
	const history = useHistory();
	const toast = useRef(null);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const query = new URLSearchParams(location.search);
	const userId = query.get('userId');

	const meetsLengthRequirement = newPassword.length >= 6;
	const meetsNumberRequirement = /\d/.test(newPassword);
	const meetsUppercaseRequirement = /[A-Z]/.test(newPassword);
	const passwordsMatch = newPassword === confirmPassword;

	const toggleNewPasswordVisibility = e => {
		e.preventDefault();
		setShowNewPassword(!showNewPassword);
	};

	const toggleConfirmPasswordVisibility = e => {
		e.preventDefault();
		setShowConfirmPassword(!showConfirmPassword);
	};

	const handleSubmit = async e => {
		e.preventDefault();

		if (!passwordsMatch) {
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'Las contraseñas no coinciden',
				life: 3000,
			});
			return;
		}

		try {
			await axios.post(
				`http://localhost:5000/api/new-user/create-password/${userId}`,
				{
					password: newPassword,
				},
			);

			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Contraseña creada exitosamente',
				life: 3000,
			});

			setTimeout(() => {
				history.push('/login');
			}, 3000);
		} catch (error) {
			const errorMessage = error.response?.data?.message || 'Error desconocido';
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: `${errorMessage}`,
				life: 3000,
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
				<h1 className={styles.formTitle}>Crea tu contraseña</h1>
				<div className={styles.formGrid}>
					<div className={styles.formGroup}>
						<label htmlFor="newPassword">Nueva Contraseña:</label>
						<InputText
							id="newPassword"
							name="newPassword"
							value={newPassword}
							type={showNewPassword ? 'text' : 'password'}
							onChange={e => setNewPassword(e.target.value)}
						/>
						<Button
							type="button"
							icon={showNewPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
							onClick={toggleNewPasswordVisibility}
							className={styles.eyeButton}
						/>
					</div>

					<div className={styles.formGroup}>
						<label htmlFor="confirmPassword">Confirmar Contraseña:</label>
						<InputText
							id="confirmPassword"
							name="confirmPassword"
							value={confirmPassword}
							type={showConfirmPassword ? 'text' : 'password'}
							onChange={e => setConfirmPassword(e.target.value)}
						/>
						<Button
							type="button"
							icon={showConfirmPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
							onClick={toggleConfirmPasswordVisibility}
							className={styles.eyeButton}
						/>
					</div>
				</div>

				{/* Instrucciones de la contraseña con iconos de verificación */}
				<div className={styles.passwordInstructions}>
					<p>Instrucciones para la contraseña:</p>
					<ul>
						<li>
							<span className={styles.instruction}>
								Debe tener un mínimo de 6 caracteres
								<i
									className={classNames(
										'pi',
										meetsLengthRequirement ? 'pi-check' : 'pi-times',
										meetsLengthRequirement
											? styles.checkIcon
											: styles.errorIcon,
									)}
								/>
							</span>
						</li>
						<li>
							<span className={styles.instruction}>
								Debe incluir al menos 1 número
								<i
									className={classNames(
										'pi',
										meetsNumberRequirement ? 'pi-check' : 'pi-times',
										meetsNumberRequirement
											? styles.checkIcon
											: styles.errorIcon,
									)}
								/>
							</span>
						</li>
						<li>
							<span className={styles.instruction}>
								Debe contener al menos una letra mayúscula
								<i
									className={classNames(
										'pi',
										meetsUppercaseRequirement ? 'pi-check' : 'pi-times',
										meetsUppercaseRequirement
											? styles.checkIcon
											: styles.errorIcon,
									)}
								/>
							</span>
						</li>
						<li>
							<span className={styles.instruction}>
								Debe coincidir la contraseña
								<i
									className={classNames(
										'pi',
										passwordsMatch &&
											newPassword !== '' &&
											confirmPassword !== ''
											? 'pi-check'
											: 'pi-times',
										passwordsMatch &&
											newPassword !== '' &&
											confirmPassword !== ''
											? styles.checkIcon
											: styles.errorIcon,
									)}
								/>
							</span>
						</li>
					</ul>
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

export default CreatePasswordPage;
