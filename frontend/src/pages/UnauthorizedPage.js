import { Button } from 'primereact/button';
import React, { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css';
import useAuth from '../hooks/useAuth';
const UnauthorizedPage = () => {
	const { logout } = useAuth();
	const history = useHistory();
	const toast = useRef(null);
	const handleLogout = () => {
		logout();
		history.push('/login');
	};
	return (
		<div className={styles.loginContainer}>
			<h1 className={styles.title}>Acceso no autorizado</h1>
			<p>
				Para acceder a esta página, por favor inicie sesión con un usuario
				autorizado.
			</p>
			<Button
				label="Iniciar sesión"
				className={styles.loginButton}
				onClick={handleLogout}
			/>
		</div>
	);
};

export default UnauthorizedPage;
