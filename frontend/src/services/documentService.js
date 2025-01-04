import axios from 'axios';

const API_URL = 'http://localhost:8080/api/process-document/';

const addADocument = formData => {
	return axios.post(API_URL, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
};

//TODO: add to the API_URL/training/
const addingTrainingDocuments = formData => {
	return axios.post(API_URL, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});
};

const getDocumentById = (id, documentType) => {
	return axios.get(`${API_URL}${id}`, {
		params: { documentType },
	});
};

const updateDocument = (id, documentType, updatedData) => {
	return axios.put(`${API_URL}${id}`, { documentType, ...updatedData });
};

const getDocumentsList = async () => {
	try {
		const response = await axios.get(API_URL);
		return response.data;
	} catch (error) {
		console.error('Error en getDocumentsList:', error);
		throw error;
	}
};

const requestRevalidation = async (documentId) => {
	return axios.post(`${API_URL}${documentId}/revalidation`);
};

const documentService = {
	addADocument,
	addingTrainingDocuments,
	getDocumentById,
	updateDocument,
	getDocumentsList,
	requestRevalidation,
};

export default documentService;
