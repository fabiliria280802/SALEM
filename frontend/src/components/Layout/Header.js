import React, { useEffect, useState } from 'react';
import { Button, Menubar } from 'primereact';
import logo from '../../assets/logo.png';
import styles from '../../styles/Header.module.css';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Header = () => {
	const { isAuthenticated, logout, user } = useAuth();
	const [isMobile, setIsMobile] = useState(false);
	const history = useHistory();
	const location = useLocation();

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768);
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

	const hideMenuItemsIn = [
		'/documents',
		'/upload-document',
		'/training',
		'/create-user',
		'/users-management',
		'/user-account',
		'/dashboard',
		'/edit-user',
		'/document-analizer',
	];
	const shouldShowMenuItems = !hideMenuItemsIn.includes(location.pathname);

	const pageTitles = {
		'/training': 'Entrenamiento',
		'/dashboard': 'Dashboard Administrativo',
		'/create-user': 'Crear Usuario',
		'/upload-document': 'Carga de Documentos',
		'/documents': 'Documentos',
		'/users-management': 'Gestión de Usuarios',
		'/user-account': 'Cuenta de Usuario',
		'/edit-user': 'Editar usuario',
	};

	const pageTitle = pageTitles[location.pathname] || 'Nombre de la pestaña';

	const start = (
		<div style={{ display: 'flex', alignItems: 'center' }}>
			<img
				src={logo}
				alt="Logo"
				style={{ height: '40px' }}
				onClick={() => history.push('/')}
			/>
		</div>
	);

	const menuOptionsByRole = {
		Administrador: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Estatus', command: () => handleMenuItemClick('/status') },
			{
				label: 'Documentos',
				command: () => handleMenuItemClick('/documents'),
			},
			{
				label: 'Entrenamiento',
				command: () => handleMenuItemClick('/training'),
			},
			{ label: 'Permisos', command: () => handleMenuItemClick('/permissions') },
			{
				label: 'Gestión de usuarios',
				command: () => handleMenuItemClick('/users-management'),
			},
			{ label: 'Cuenta', command: () => handleMenuItemClick('/user-account') },
		],
		Proveedor: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Estatus', command: () => handleMenuItemClick('/status') },
			{
				label: 'Mis documentos',
				command: () => handleMenuItemClick('/documents'),
			},
			{ label: 'Cuenta', command: () => handleMenuItemClick('/user-account') },
		],
		Gestor: [
			{ label: 'Inicio', command: () => handleMenuItemClick('/') },
			{ label: 'Estatus', command: () => handleMenuItemClick('/status') },
			{
				label: 'Documentos',
				command: () => handleMenuItemClick('/documents'),
			},
			{
				label: 'Entrenamiento',
				command: () => handleMenuItemClick('/training'),
			},
			{ label: 'Cuenta', command: () => handleMenuItemClick('/user-account') },
		],
	};

	const menuItems =
		isAuthenticated && shouldShowMenuItems && user
			? menuOptionsByRole[user.role] || []
			: [];

	const renderEndButton = () => {
		if (isAuthenticated) {
			if (shouldShowMenuItems) {
				return (
					<Button
						label="Logout"
						icon="pi pi-sign-out"
						className="p-button-secondary"
						onClick={handleLogout}
					/>
				);
			} else {
				return (
					<div className={styles.pageContainerTitle}>
						<span className={styles.pageTitle}>{pageTitle}</span>
					</div>
				);
			}
			return (
				<Button
					label="Logout"
					icon="pi pi-sign-out"
					className="p-button-secondary"
					onClick={handleLogout}
				/>
			);
		} else {
			return (
				<Button
					label="Iniciar sesión"
					className={styles.buttons}
					onClick={() => history.push('/login')}
				/>
			);
		}
	};

	const headerClass = shouldShowMenuItems
		? styles.headerShadow
		: styles.headerWithImage;

	return (
		<Menubar
			className={`${styles.header} ${headerClass}`}
			model={!isMobile ? menuItems : []}
			start={start}
			end={renderEndButton()}
		/>
	);
};

export default Header;
