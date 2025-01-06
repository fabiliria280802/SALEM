import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/public`;

/*const API_URL = 'http://localhost:5000/api/public';*/

const getUserByEmail = async email => {
	try {
		const response = await axios.get(`${API_URL}/email/${email}`);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const verifyResetCode = async data => {
	try {
		const response = await axios.post(`${API_URL}/verify-reset-code`, data);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const getUserByRuc = async ruc => {
	try {
		const response = await axios.get(`${API_URL}/ruc/${ruc}`);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const publicService = {
	getUserByEmail,
	verifyResetCode,
	getUserByRuc,
};

export default publicService;
