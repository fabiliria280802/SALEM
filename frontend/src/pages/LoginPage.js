import { Button } from 'primereact/button';
import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../styles/LoginPage.module.css';
import { Toast } from 'primereact/toast';
import publicService from '../services/publicService';
import userService from '../services/userService';
import { Dialog } from 'primereact/dialog';

const LoginPage = () => {
	const { login, setIsAuthenticated } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [failedAttempts, setFailedAttempts] = useState(0);
	const [showPopup, setShowPopup] = useState(false);
	const history = useHistory();
	const toast = useRef(null);

	const handleSubmit = async e => {
		e.preventDefault();
		if (!email.trim() || !password.trim()) {
			toast.current.show({
				severity: 'warn',
				summary: 'Advertencia',
				detail: 'Debe llenar todos los campos del formulario',
				life: 3000,
			});
			return;
		}

		try {
			await login(email, password);
			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Sesión iniciada correctamente',
				life: 3000,
			});
			setFailedAttempts(0);

			setTimeout(() => {
				history.push('/');
			}, 1500);
		} catch (error) {
			const errorMessage = error.response?.data?.message;
			const statusCode = error.response?.status;

			// Muestra mensaje de error específico o general según el código de error
			if (statusCode === 403 || statusCode === 406 || statusCode === 404) {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
					life: 5000,
				});
				return;
			}

			// Incrementar intentos fallidos en caso de otro error
			const currentAttempts = failedAttempts + 1;
			setFailedAttempts(currentAttempts);

			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: `Credenciales incorrectas. Intentos restantes: ${3 - currentAttempts}`,
				life: 3000,
			});

			if (currentAttempts === 3) {
				try {
					const user = await publicService.getUserByEmail(email);
					if (user) {
						console.log('Usuario encontrado para reset:', user);
						setShowPopup(true);
					}
				} catch (err) {
					toast.current.show({
						severity: 'error',
						summary: 'Error',
						detail: err.message || 'Error al enviar correo de restablecimiento',
						life: 3000,
					});
				}
			}
		}
	};

	const togglePasswordVisibility = e => {
		e.preventDefault();
		setShowPassword(!showPassword);
	};

	const handlePopupConfirm = () => {
		setShowPopup(false);
		history.push('/reset-password');
	};

	const handlePopupCancel = () => {
		setShowPopup(false);
	};

	return (
		<div className={styles.loginPage}>
			<Toast ref={toast} />
			<h1 className={styles.contentTitle}>Inicia Sesión</h1>
			<p className={styles.contentText}>
				Tu cuenta, tu espacio. <br /> Conéctate para continuar
			</p>
			<Button
				type="button"
				label="Continuar con Microsoft"
				icon="pi pi-microsoft"
				className={styles.microsoftButton}
			/>
			<p className={styles.contentInfo}>
				Inicio de sesión con Microsoft 365 únicamente disponible para <br />{' '}
				colaboradores de ENAP.
			</p>
			<form onSubmit={handleSubmit}>
				<div className={styles.emailInput}>
					<label>Correo electrónico</label>
					<input
						type="text"
						name="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
					/>
				</div>
				<div className={styles.passwordContainer}>
					<label>Contraseña</label>
					<div className={styles.passwordInput}>
						<input
							type={showPassword ? 'text' : 'password'}
							name="password"
							value={password}
							onChange={e => setPassword(e.target.value)}
						/>
						<Button
							type="button"
							icon={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
							onClick={togglePasswordVisibility}
							className={styles.eyeButton}
						/>
					</div>
				</div>
				<Button
					type="submit"
					className={`${styles.buttons} ${failedAttempts >= 3 ? styles.disabledButton : ''}`}
					label="Continuar"
					disabled={failedAttempts >= 3}
					data-testid="submit-button-main-form"
				/>
			</form>

			<Dialog
				visible={showPopup}
				header="Verificación de correo"
				modal
				onHide={() => setShowPopup(false)}
				footer={
					<div>
						<Button
							label="Sí"
							icon="pi pi-check"
							onClick={handlePopupConfirm}
						/>
						<Button label="No" icon="pi pi-times" onClick={handlePopupCancel} />
					</div>
				}
			>
				<p>¿Te llegó el correo de restablecimiento de contraseña?</p>
			</Dialog>
		</div>
	);
};

export default LoginPage;
