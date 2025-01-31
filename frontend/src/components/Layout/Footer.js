import styles from '../../styles/Footer.module.css';

const Footer = () => {
	return (
		<div className={styles.footer}>
			<div className={styles.footerContainer}>
				<p className={styles.footerText}>
					<span>Copyright ® ENAP Ecuador.</span> Av. Granados Vía a Nayón,
					Edificio EKOPARK - Torre 3 Piso 3, Quito - Ecuador.
				</p>
			</div>
		</div>
	);
};

export default Footer;
