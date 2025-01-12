import axios from 'axios';

// URL base para las solicitudes al backend
const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/documents`;

// Función para obtener todos los documentos
export const getDocuments = async () => {
    try {
        const token = localStorage.getItem('token'); // Obtener el token JWT del almacenamiento local
        if (!token) {
            throw new Error('Token no encontrado. Por favor, inicia sesión nuevamente.');
        }

        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${token}`, // Enviar el token en los encabezados
            },
        });
        return response.data; // Retornar los datos obtenidos
    } catch (error) {
        console.error('Error al obtener los documentos:', error.response?.data || error.message);
        throw error; // Lanzar el error para manejarlo en el frontend
    }
};

// Exportar todas las funciones necesarias
const documentsService = {
    getDocuments,
};

export default documentsService;
