import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://localhost:8080/api/auth/';

const login = async (email, password) => {
	try {
		const response = await axios.post(API_URL + 'login', { email, password });
		if (response.data.token) {
			localStorage.setItem('token', response.data.token);
			localStorage.setItem('user', JSON.stringify(response.data.user));
		}
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const logout = () => {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
};

const getToken = () => {
	return localStorage.getItem('token');
};

const decodeToken = token => {
	return jwtDecode(token); // Decodifica el token JWT
};

export default {
	login,
	logout,
	getToken,
	decodeToken,
};
