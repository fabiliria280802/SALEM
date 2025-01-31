import axios from 'axios';
import authService from './authService';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/users/`;
/*
const API_URL = 'http://localhost:8080/api/users/';
*/
const createUser = async userData => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};
		const response = await axios.post(API_URL, userData, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const getAllUsers = async () => {
	const token = authService.getToken();
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};
	const response = await axios.get(API_URL, config);
	return response.data;
};

const getAUser = async userId => {
	const token = authService.getToken();

	if (!token) {
		throw new Error('Token no disponible');
	}

	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	};

	const response = await axios.get(`${API_URL}${userId}`, config);
	return response.data;
};
//TODO: borrar endpoint
const suspendUser = async userId => {
	const token = authService.getToken();
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	};

	const response = await axios.put(
		`${API_URL}${userId}`,
		{ status: 'Inactivo' },
		config,
	);
	return response.data;
};

const resumeUser = async userId => {
	const token = authService.getToken();
	const config = {
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
	};
	const response = await axios.put(
		`${API_URL}${userId}`,
		{ status: 'Activo' },
		config,
	);
	return response.data;
};

const updateUser = async (userId, userData) => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const response = await axios.put(`${API_URL}${userId}`, userData, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const userService = {
	createUser,
	getAllUsers,
	getAUser,
	suspendUser,
	resumeUser,
	updateUser,
};

export default userService;
