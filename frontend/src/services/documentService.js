import axios from 'axios';
import authService from './authService';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api`;
/*
const API_URL = 'http://localhost:5000/api';
*/
const documentService = {
	// Métodos para Contratos
	uploadContract: async (formData) => {
		try {
			// Debug para verificar el contenido del FormData
			console.log('Contenido del FormData:');
			for (let pair of formData.entries()) {
				console.log(pair[0] + ': ' + pair[1]);
			}

			const documentType = formData.get('documentType');
			console.log('DocumentType en servicio:', documentType);

			if (documentType !== 'Contract') {
				throw new Error(`Tipo de documento inválido. Se esperaba 'Contract', se recibió '${documentType}'`);
			}

			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data'
				}
			};
			const response = await axios.post(`${API_URL}/contract`, formData, config);
			return response.data;
		} catch (error) {
			console.error('Error en uploadContract:', error);
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	getContractById: async (id) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.get(`${API_URL}/contract/${id}`, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	updateContract: async (id, data) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			};
			const response = await axios.put(`${API_URL}/contract/${id}`, data, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},

	// Métodos para Actas de Servicio
	uploadServiceRecord: async (formData) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data'
				}
			};
			const response = await axios.post(`${API_URL}/service-record`, formData, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	getServiceRecordById: async (id) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.get(`${API_URL}/service-record/${id}`, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	updateServiceRecord: async (id, data) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			};
			const response = await axios.put(`${API_URL}/service-record/${id}`, data, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},

	// Métodos para Facturas
	uploadInvoice: async (formData) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'multipart/form-data'
				}
			};
			const response = await axios.post(`${API_URL}/invoice`, formData, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	getInvoiceById: async (id) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.get(`${API_URL}/invoice/${id}`, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},
	updateInvoice: async (id, data) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			};
			const response = await axios.put(`${API_URL}/invoice/${id}`, data, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},

	// Métodos generales
	getDocumentsList: async () => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.get(`${API_URL}/documents`, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},

	requestRevalidation: async (id) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.post(`${API_URL}/documents/${id}/revalidation`, {}, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	},

	notifyManagers: async (id) => {
		try {
			const token = authService.getToken();
			const config = {
				headers: {
					Authorization: `Bearer ${token}`
				}
			};
			const response = await axios.post(`${API_URL}/documents/${id}/notify-managers`, {}, config);
			return response.data;
		} catch (error) {
			if (error.response && error.response.data.errors) {
				throw error.response.data.errors;
			}
			throw error;
		}
	}
};

export default documentService;
