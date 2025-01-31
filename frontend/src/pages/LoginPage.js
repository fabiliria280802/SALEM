import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../styles/LoginPage.module.css';
import publicService from '../services/publicService';

const LoginPage = () => {
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [failedAttempts, setFailedAttempts] = useState(0);
	const [showPopup, setShowPopup] = useState(false);
	const toast = useRef(null);
	const history = useHistory();

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
			history.push('/');
		} catch (error) {
			const errorMessage =
				error.response?.data?.message || 'Error al iniciar sesión';
			const statusCode = error.response?.status;

			if (statusCode === 403 || statusCode === 406 || statusCode === 404) {
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
					life: 5000,
				});
				return;
			}

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

	const togglePasswordVisibility = () => setShowPassword(!showPassword);

	const handlePopupConfirm = () => {
		setShowPopup(false);
		history.push('/reset-password');
	};

	const handlePopupCancel = () => {
		setShowPopup(false);
	};

	return (
		<div className={styles.container}>
			<img
				src={require('../assets/White-Logo.png')}
				alt="Logo"
				className={styles.logo}
			/>
			<div className={styles.loginBox}>
				<Toast ref={toast} />
				<h1 className={styles.title}>Iniciar sesión</h1>
				<form onSubmit={handleSubmit} className={styles.form}>
					<div className={styles.inputGroup}>
						<label htmlFor="email" className={styles.label}>
							Correo electrónico
						</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							className={styles.input}
							placeholder="Correo electrónico"
						/>
					</div>
					<div className={styles.inputGroup}>
						<label htmlFor="password" className={styles.label}>
							Contraseña
						</label>
						<div className={styles.formGroup}>
							<input
								type={showPassword ? 'text' : 'password'}
								id="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								className={styles.input}
								placeholder="Contraseña"
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
						label="Iniciar sesión"
						className={`${styles.loginButton} ${failedAttempts >= 3 ? styles.disabledButton : ''}`}
						disabled={failedAttempts >= 3}
					/>
				</form>
			</div>
			{/* Pop-up actualizado */}
			<Dialog
				visible={showPopup}
				modal
				onHide={() => setShowPopup(false)}
				style={{ width: '30vw', textAlign: 'center', borderRadius: '10px' }}
				footer={
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							gap: '10px',
							padding: '10px',
						}}
					>
						<Button
							label="Continuar"
							icon="pi pi-check"
							className="p-button-success"
							onClick={handlePopupConfirm}
							style={{ width: '120px' }}
						/>
						<Button
							label="Volver"
							icon="pi pi-arrow-left"
							className="p-button-secondary"
							onClick={handlePopupCancel}
							style={{ width: '120px' }}
						/>
					</div>
				}
			>
				<div style={{ padding: '20px 10px' }}>
					<p style={{ color: '#555', marginBottom: '15px' }}>
						Hemos enviado un correo con instrucciones para restablecer tu
						contraseña.
					</p>
					<p style={{ color: '#999', fontSize: '14px' }}>
						Si no lo encuentras, revisa tu carpeta de spam o correo no deseado.
					</p>
				</div>
			</Dialog>
		</div>
	);
};

export default LoginPage;
