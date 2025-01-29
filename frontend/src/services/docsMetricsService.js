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
		console.error('Error al obtener las métricas de IA:', error);
		throw error;
	}
};

const createDocsMetrics = async metricsData => {
	try {
		const token = localStorage.getItem('token');
		const response = await axios.post(API_URL, metricsData, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error al crear métricas de IA:', error);
		throw error;
	}
};

const docsMetricsService = {
	getDocsMetrics,
	createDocsMetrics,
}

export default docsMetricsService;