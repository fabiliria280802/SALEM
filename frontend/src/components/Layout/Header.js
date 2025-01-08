import React, { useEffect, useState } from 'react';
import { Menubar } from 'primereact';
import logo from '../../assets/logo.png';
import styles from '../../styles/Header.module.css';
import { useHistory } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
	const { isAuthenticated, logout, user } = useAuth();
	const [isMobile, setIsMobile] = useState(false);
	const history = useHistory();

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 1200); 
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleLogout = () => {
		logout();
		history.push('/login');
	};

	const handleMenuItemClick = path => {
		history.push(path);
	};

	const menuOptionsByRole = {
		Administrador: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Reportes', command: () => handleMenuItemClick('/dashboard') },
			{ label: 'Documentos', command: () => handleMenuItemClick('/documents') },
			{
				label: 'Entrenar IA',
				command: () => handleMenuItemClick('/training'),
			},
			{
				label: 'Gestionar usuarios',
				command: () => handleMenuItemClick('/users-management'),
			},
			{ label: 'Mi cuenta', command: () => handleMenuItemClick('/user-account') },
		],
		Proveedor: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Reportes', command: () => handleMenuItemClick('/dashboard') },
			{
				label: 'Mis documentos',
				command: () => handleMenuItemClick('/documents'),
			},
			{ label: 'Mi cuenta', command: () => handleMenuItemClick('/user-account') },
		],
		Gestor: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Reportes', command: () => handleMenuItemClick('/dashboard') },
			{ label: 'Ver documentos', command: () => handleMenuItemClick('/documents') },
			{
				label: 'Entrenar IA',
				command: () => handleMenuItemClick('/training'),
			},
			{ label: 'Mi cuenta', command: () => handleMenuItemClick('/user-account') },
		],
	};

	const menuItems =
		isAuthenticated && user ? menuOptionsByRole[user.role] || [] : [];

	const renderEndButton = () => {
		if (isAuthenticated) {
			if (isMobile) {
				return (
					<div className={styles.dropdown}>
						<button className={styles.dropdownButton}>
							<i className="pi pi-bars" /> {/* Ícono de las tres rayas */}
						</button>
						<div className={styles.dropdownContent}>
							{menuItems.map((item, index) => (
								<div
									key={index}
									className={styles.dropdownItem}
									onClick={item.command}
								>
									{item.label}
								</div>
							))}
							<div className={styles.dropdownItem} onClick={handleLogout}>
								Cerrar sesión
							</div>
						</div>
					</div>
				);
			}
			return (
				<div className={styles.desktopButtons}>
					<button
						className={`p-button ${styles.sessionButton}`}
						onClick={handleLogout}
					>
						Cerrar sesión
					</button>
				</div>
			);
		}

		// Si el usuario no está autenticado, solo mostrar el botón de "Iniciar sesión"
		return (
			<button
				className={`p-button ${styles.sessionButton}`}
				onClick={() => history.push('/login')}
			>
				Iniciar sesión
			</button>
		);
	};

	const start = (
		<div className={styles.startContainer}>
			<img
				src={logo}
				alt="Logo"
				style={{ height: '40px' }}
				onClick={() => history.push('/')}
			/>
		</div>
	);

	return (
		<Menubar
			className={styles.header}
			model={isAuthenticated && !isMobile ? menuItems : []} // Mostrar el Menubar solo si está autenticado y no es móvil
			start={start}
			end={renderEndButton()}
		/>
	);
};

export default Header;
