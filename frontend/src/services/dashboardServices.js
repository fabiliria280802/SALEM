import axios from 'axios';
import authService from './authService'; // Asegúrate de que authService esté configurado correctamente

// Base URL del API
const API_BASE_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/report`;

// Configuración para solicitudes con el token JWT
const getConfig = () => {
    const token = authService.getToken();
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
};

// Obtener estadísticas de contratos rechazados
export const getContractsStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/contracts/contracts-stats`, getConfig());
        return response.data;
    } catch (error) {
        console.error('Error al obtener las estadísticas de contratos:', error);
        throw error;
    }
};

// Obtener estadísticas de facturas
export const getInvoicesStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/invoices/invoices-stats`, getConfig());
        return response.data;
    } catch (error) {
        console.error('Error al obtener las estadísticas de facturas:', error);
        throw error;
    }
};

// Obtener estadísticas de registros de entrega
export const getServiceRecordsStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/service-records/service-records-stats`, getConfig());
        return response.data;
    } catch (error) {
        console.error('Error al obtener las estadísticas de registros de entrega:', error);
        throw error;
    }
};

// Obtener estadísticas de métricas de IA
export const getAiStats = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/ia-metrics/ai-stats`, getConfig());
        return response.data;
    } catch (error) {
        console.error('Error al obtener las estadísticas de IA:', error);
        throw error;
    }
};
