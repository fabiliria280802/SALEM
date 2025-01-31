import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import styles from '../styles/UsersManagementPage.module.css';
import userService from '../services/userService';
import { Toast } from 'primereact/toast';
import UserCard from '../components/UserCard';

const UsersManagementPage = () => {
	const history = useHistory();
	const [users, setUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [showPopup, setShowPopup] = useState(false);
	const [userToSuspend, setUserToSuspend] = useState(null);
	const [appliedFilters, setAppliedFilters] = useState([]);
	const toast = useRef(null);

	const fieldMap = {
		nombre: 'name',
		apellidos: 'last_name',
		correo: 'email',
		teléfono: 'phone',
		ruc: 'ruc',
		empresa: 'company_name',
		rol: 'role',
		estado: 'status',
	};

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const data = await userService.getAllUsers();
				setUsers(data);
				setFilteredUsers(data);
			} catch (error) {
				console.error('Error al cargar usuarios:', error);
				toast.current.show({
					severity: 'error',
					summary: 'Error',
					detail: 'No se pudieron cargar los usuarios',
					life: 3000,
				});
			}
		};

		fetchUsers();
	}, []);

	const handleSearch = () => {
		if (searchTerm.trim() !== '') {
			const [key, value] = searchTerm.split(':').map(str => str.trim());
			const mappedKey = fieldMap[key.toLowerCase()];

			if (mappedKey && value) {
				setAppliedFilters([...appliedFilters, { key: mappedKey, value }]);
				setSearchTerm('');
			} else {
				toast.current.show({
					severity: 'error',
					summary: 'Error de Formato',
					detail: 'Use el formato "campo:valor" con un campo válido',
					life: 3000,
				});
			}
		}
	};

	const handleSearchKeyDown = e => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	useEffect(() => {
		const filtered = users.filter(user => {
			return appliedFilters.every(filter => {
				const { key, value } = filter;
				const userValue = user[key]
					? user[key].toString().toLowerCase().trim()
					: '';
				const filterValue = value.toLowerCase().trim();

				return key === 'status'
					? userValue === filterValue
					: userValue.includes(filterValue);
			});
		});
		setFilteredUsers(filtered);
	}, [appliedFilters, users]);

	const handleRemoveFilter = filter => {
		setAppliedFilters(
			appliedFilters.filter(
				item => item.key !== filter.key || item.value !== filter.value,
			),
		);
	};

	const handleToggleClick = user => {
		setUserToSuspend(user);
		setShowPopup(true);
	};

	const confirmToggleUserStatus = async () => {
		if (userToSuspend) {
			await toggleUserStatus(userToSuspend);
			setShowPopup(false);

			toast.current.show({
				severity: 'success',
				summary: 'Éxito',
				detail: `El estado de ${userToSuspend.name} ${userToSuspend.last_name} ha sido actualizado.`,
				life: 2900,
			});
		}
	};

	const toggleUserStatus = async user => {
		try {
			if (user.status === 'Activo') {
				await userService.suspendUser(user._id);
				updateUserStatus(user._id, 'Inactivo');
			} else {
				await userService.resumeUser(user._id);
				updateUserStatus(user._id, 'Activo');
			}
		} catch (error) {
			console.error('Error al cambiar el estado del usuario:', error);
			toast.current.show({
				severity: 'error',
				summary: 'Error',
				detail: 'No se pudo actualizar el estado del usuario',
				life: 3000,
			});
		}
	};

	const updateUserStatus = (userId, newStatus) => {
		const updateUsers = users =>
			users.map(u => (u._id === userId ? { ...u, status: newStatus } : u));

		setUsers(updateUsers);
		setFilteredUsers(updateUsers);
	};

	const handleEditClick = user => {
		history.push(`/edit-user/${user._id}`);
	};

	return (
		<div className={styles.usersManagementPage}>
			<Toast ref={toast} />
			<div className={styles.container}>
				<h1 className={styles.formTitle}>Gestión de usuarios</h1>

				<p className={styles.searchNote}>
					<strong>Nota: </strong>
					Para filtrar escribe nombre_campo:valor y da click en la lupa o
					presiona la tecla Enter
				</p>

				<div className={styles.filterContainer}>
					<div className={styles.searchWrapper}>
						<i
							className={`pi pi-search ${styles.searchIcon}`}
							onClick={handleSearch}
						/>
						<input
							type="text"
							value={searchTerm}
							onKeyDown={handleSearchKeyDown}
							onChange={e => setSearchTerm(e.target.value)}
							className={styles.searchInput}
							placeholder="Buscar usuarios..."
						/>
					</div>

					<div className={styles.appliedFiltersContainer}>
						{appliedFilters.map((filter, index) => (
							<span key={index} className={styles.filteredTag}>
								{`${Object.keys(fieldMap).find(key => fieldMap[key] === filter.key)}: ${filter.value}`}
								<span
									className={styles.clearButton}
									onClick={() => handleRemoveFilter(filter)}
								>
									✕
								</span>
							</span>
						))}
					</div>
				</div>

				<div className={styles.buttonContainer}>
					<button
						className={styles.newButton}
						onClick={() => history.push('/create-user')}
					>
						Crear usuario
					</button>
					<button
						className={styles.exitButton}
						onClick={() => history.push('/')}
					>
						Volver al menú principal
					</button>
				</div>

				{/* Vista de tabla para pantallas grandes */}
				<div className={styles.tableContainer}>
					<table className={styles.usersTable}>
						<thead>
							<tr>
								<th>Nombres</th>
								<th>Apellidos</th>
								<th>Correo</th>
								<th>Teléfono</th>
								<th>RUC</th>
								<th>Empresa</th>
								<th>Rol</th>
								<th>Estado</th>
								<th>Control</th>
							</tr>
						</thead>
						<tbody>
							{filteredUsers.map((user, index) => (
								<tr key={index}>
									<td>{user.name}</td>
									<td>{user.last_name}</td>
									<td>{user.email}</td>
									<td>{user.phone}</td>
									<td>{user.ruc}</td>
									<td>{user.company_name}</td>
									<td>{user.role}</td>
									<td>{user.status}</td>
									<td>
										<button
											className={styles.editButton}
											onClick={() => handleEditClick(user)}
										>
											Editar
										</button>
										<button
											className={
												user.status === 'Inactivo'
													? styles.resumeButton
													: styles.deleteButton
											}
											onClick={() => handleToggleClick(user)}
										>
											{user.status === 'Inactivo' ? 'Reanudar' : 'Suspender'}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Vista de cards para pantallas pequeñas */}
				<div className={styles.cardContainer}>
					{filteredUsers.map((user, index) => (
						<UserCard
							key={index}
							user={user}
							onEdit={handleEditClick}
							onToggleStatus={handleToggleClick}
						/>
					))}
				</div>

				{showPopup && (
					<div className={styles.popup}>
						<div className={styles.popupContent}>
							<h2>
								{userToSuspend?.status === 'Activo'
									? `¿Seguro deseas inhabilitar a ${userToSuspend?.name} ${userToSuspend?.last_name}?`
									: `¿Seguro deseas habilitar a ${userToSuspend?.name} ${userToSuspend?.last_name}?`}
							</h2>
							<p>
								{userToSuspend?.status === 'Activo'
									? 'Una vez desactivado, este usuario no podrá acceder al sistema.'
									: 'Este usuario podrá acceder nuevamente al sistema.'}
							</p>
							<div className={styles.popupActions}>
								<button
									onClick={confirmToggleUserStatus}
									className={styles.confirmButton}
								>
									Confirmar
								</button>
								<button
									onClick={() => setShowPopup(false)}
									className={styles.cancelButton}
								>
									Cancelar
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default UsersManagementPage;
