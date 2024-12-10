import React from 'react';
import { Button } from 'primereact/button';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../styles/HomePage.module.css';
import homePageImage from '../assets/homePage.png';

const HomePage = () => {
	const { user } = useAuth();
	const history = useHistory();
	const firstName = user?.name ? user.name.split(' ')[0] : 'Sin nombre';
	const handleLoginClick = () => {
		history.push('/login');
	};

	return (
		<div className={styles.homePageContainer}>
			<div className={styles.outerSquare}>
				{user ? (
					<div className={styles.homePageInfo}>
						<h1 className={styles.homePageTitle}>
							{user.company_name || 'Sin empresa'} - {user.role || 'Sin rol'}
						</h1>
						<p className={styles.homePageParagraph}>
							<b>¡Hola {firstName}!</b>
						</p>
						<p className={styles.homePageParagraph}>
							Mantén tus procesos <br />
							bajo control fácilmente.
						</p>
						<Button
							label="Nuevo"
							className={styles.buttons}
							onClick={() => history.push('/upload-contract')}
						/>
						<Button
							label="Revisión"
							className={styles.buttonReverse}
							onClick={() => history.push('/dashboard')}
						/>
					</div>
				) : (
					<div className={styles.homePageInfo}>
						<h1 className={styles.homePageTitle}>¡Te esperamos!</h1>
						<p className={styles.homePageParagraph}>
							<b>Automatización inteligente para la gestión de documentos</b>
						</p>
						<Button
							label="Iniciar sesión"
							className={styles.buttons}
							onClick={handleLoginClick}
						/>
					</div>
				)}
				<div className={styles.homePageImage}>
					<img src={homePageImage} alt="Home Page" />
				</div>
			</div>
		</div>
	);
};

export default HomePage;
