const express = require('express');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '../data')); // Guardar en la carpeta "backend/data"
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + '-' + file.originalname); // Nombre único para evitar conflictos
	},
});

// Configurar multer para aceptar múltiples archivos
const upload = multer({ storage });

const router = express.Router();

router.post('/', upload.single('file'), documentController.addADocument);
router.post(
	'/trainnig/',
	upload.array('files', 10),
	documentController.addingTrainingDocuments,
);
router.get('/:id', documentController.getDocumentById);
router.put('/:id', documentController.updateDocument);
router.get('/', documentController.getDocumentsList);

module.exports = router;
