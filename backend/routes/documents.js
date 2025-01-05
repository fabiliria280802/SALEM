const express = require('express');
const router = express.Router();
const {
	addDocument,
	getAllDocuments,
	getDocumentById,
	updateDocument,
	deleteDocument,
} = require('../controllers/documentController');

router.post('/', addDocument);
router.get('/', getAllDocuments);
router.get('/:id', getDocumentById);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
