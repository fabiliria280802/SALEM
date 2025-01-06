import React from 'react';
import styles from './UserCard.module.css';

export const UserCard = ({ user, onEdit, onToggleStatus }) => {
	return (
		<div className={styles.card}>
			<div className={styles.cardHeader}>
				<h3>{`${user.name} ${user.last_name}`}</h3>
				<span
					className={`${styles.status} ${styles[user.status.toLowerCase()]}`}
				>
					{user.status}
				</span>
			</div>

			<div className={styles.cardBody}>
				<div className={styles.field}>
					<span className={styles.label}>Correo:</span>
					<span className={styles.value}>{user.email}</span>
				</div>
				<div className={styles.field}>
					<span className={styles.label}>Teléfono:</span>
					<span className={styles.value}>{user.phone}</span>
				</div>
				<div className={styles.field}>
					<span className={styles.label}>RUC:</span>
					<span className={styles.value}>{user.ruc}</span>
				</div>
				<div className={styles.field}>
					<span className={styles.label}>Empresa:</span>
					<span className={styles.value}>{user.company_name}</span>
				</div>
				<div className={styles.field}>
					<span className={styles.label}>Rol:</span>
					<span className={styles.value}>{user.role}</span>
				</div>
			</div>

			<div className={styles.cardActions}>
				<button className={styles.editButton} onClick={() => onEdit(user)}>
					Editar
				</button>
				<button
					className={
						user.status === 'Inactivo'
							? styles.resumeButton
							: styles.deleteButton
					}
					onClick={() => onToggleStatus(user)}
				>
					{user.status === 'Inactivo' ? 'Reanudar' : 'Suspender'}
				</button>
			</div>
		</div>
	);
};

export default UserCard;
