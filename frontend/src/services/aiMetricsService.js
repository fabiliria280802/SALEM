import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/report/ia-metrics`;

const getAiMetrics = async () => {
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

const createAiMetrics = async metricsData => {
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

const aiMetricsService = {
	getAiMetrics,
	createAiMetrics,
}

export default aiMetricsService;