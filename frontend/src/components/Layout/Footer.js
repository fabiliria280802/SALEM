import 'primeicons/primeicons.css';
import { Panel } from 'primereact';
import styles from '../../styles/Footer.module.css';

const Footer = () => {
	return (
		<Panel className={styles.footer}>
			<div className={styles.footerContainer}>
				<p className={styles.footerText}>&copy; 2024 - ENAP Ecuador.</p>
				<a
					href="https://www.linkedin.com/company/enap-ecuador/"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.footerIcon}
				>
					<img
						src="https://img.freepik.com/vector-premium/logo-linkedin_578229-227.jpg"
						alt="linkedin"
						className={styles.footerImg}
					/>
				</a>
			</div>
		</Panel>
	);
};

export default Footer;
