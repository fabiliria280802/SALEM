import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/report/docs-metrics`;

const getDocsMetrics = async () => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.get(API_URL, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error al obtener las métricas de documentos:', error);
		throw error;
	}
};

// Obtener una métrica específica por ID
const getDocsMetricsById = async (id) => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_URL}/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error(`Error al obtener la métrica de documento con ID ${id}:`, error);
		throw error;
	}
};

// Crear una nueva métrica de documento
const createDocsMetrics = async (metricsData) => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.post(API_URL, metricsData, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error al crear la métrica de documento:', error);
		throw error;
	}
};

// Actualizar una métrica de documento por ID
const updateDocsMetrics = async (id, updatedData) => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.put(`${API_URL}/${id}`, updatedData, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error(`Error al actualizar la métrica de documento con ID ${id}:`, error);
		throw error;
	}
};

const docsMetricsService = {
	getDocsMetrics,
	getDocsMetricsById,
	createDocsMetrics,
	updateDocsMetrics,
};


export default docsMetricsService;