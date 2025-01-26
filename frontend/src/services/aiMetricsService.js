import axios from 'axios';

// URL del API
const API_URL = 'http://localhost:8080/api/report/ia-metrics';

// Obtener todas las métricas de IA
export const getAiMetrics = async () => {
	try {
		const token = localStorage.getItem('token'); // Obtener token JWT del almacenamiento local
		const response = await axios.get(API_URL, {
			headers: {
				Authorization: `Bearer ${token}`, // Encabezado para autenticación
			},
		});
		return response.data; // Retornar los datos obtenidos
	} catch (error) {
		console.error('Error al obtener las métricas de IA:', error);
		throw error;
	}
};

// Crear una nueva métrica de IA
export const createAiMetrics = async metricsData => {
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

// Exportar servicios adicionales si es necesario
