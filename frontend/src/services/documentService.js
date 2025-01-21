import axios from 'axios';
import authService from './authService';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/documents/`;

const uploadDocument = async (documentType, formData) => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'multipart/form-data',
			},
		};

		const response = await axios.post(`${API_URL}${documentType}`, formData, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const getDocumentById = async (documentType, documentId) => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.get(`${API_URL}${documentType}/${documentId}`, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const updateDocument = async (documentType, documentId, data) => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const response = await axios.put(`${API_URL}${documentType}/${documentId}`, data, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

/*const getAllDocuments = async () => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.get(API_URL, config);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};*/

const getAllContracts = async () => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const response = await axios.post(`${API_URL}Contract`, {}, config); // Configuración correcta
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const getAllInvoices = async () => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const response = await axios.post(`${API_URL}Invoice`, {}, config); // Configuración correcta
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const getAllServiceDeliveryRecords = async () => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		};

		const response = await axios.post(`${API_URL}ServiceDeliveryRecord`, {}, config); // Configuración correcta
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const requestRevalidation = async documentId => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.post(
			`${API_URL}${documentId}/revalidation`,
			{},
			config,
		);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const notifyManagers = async documentId => {
	try {
		const token = authService.getToken();
		const config = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const response = await axios.post(
			`${API_URL}${documentId}/notify-managers`,
			{},
			config,
		);
		return response.data;
	} catch (error) {
		if (error.response && error.response.data.errors) {
			throw error.response.data.errors;
		}
		throw error;
	}
};

const documentService = {
	uploadDocument,
	getDocumentById,
	updateDocument,
	//getAllDocuments,
	getAllInvoices,
	getAllContracts,
	getAllServiceDeliveryRecords,
	requestRevalidation,
	notifyManagers,
};

export default documentService;
