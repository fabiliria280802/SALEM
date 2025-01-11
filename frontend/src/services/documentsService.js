import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}:${process.env.REACT_APP_API_PORT}/api/documents`; // Cambia por tu URL del backend

// Obtener todos los documentos
export const getDocuments = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los documentos:', error);
    throw error;
  }
};

// Obtener un documento por ID
export const getDocumentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener el documento con ID ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo documento
export const createDocument = async (documentData) => {
  try {
    const response = await axios.post(API_URL, documentData);
    return response.data;
  } catch (error) {
    console.error('Error al crear el documento:', error);
    throw error;
  }
};

// Actualizar un documento
export const updateDocument = async (id, documentData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, documentData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el documento con ID ${id}:`, error);
    throw error;
  }
};

// Eliminar un documento
export const deleteDocument = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el documento con ID ${id}:`, error);
    throw error;
  }
};
