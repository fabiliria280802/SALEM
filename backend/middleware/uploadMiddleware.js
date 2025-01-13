const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		const uploadDir = path.join('data', 'docs');

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		cb(null, uploadDir);
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + path.extname(file.originalname));
	},
});

const fileFilter = (req, file, cb) => {
	console.log('Headers recibidos:', req.headers);
	console.log('Body recibido:', req.body);
	console.log('File recibido:', file);

	const allowedTypes = {
		Contract: ['.pdf', '.xml'],
		ServiceDeliveryRecord: ['.pdf', '.png','.xml'],
		Invoice: ['.pdf', '.png','.xml'],
	};

	const documentType = req.body.documentType;
	console.log('Tipo de documento recibido:', documentType);

	const ext = path.extname(file.originalname).toLowerCase();

	if (!documentType || !allowedTypes[documentType]) {
		console.log('Tipo de documento inválido:', documentType);
		console.log('Body completo:', req.body);
		cb(
			new Error(
				`Tipo de documento no válido. Recibido: ${documentType}. Body: ${JSON.stringify(req.body)}`,
			),
		);
		return;
	}

	if (allowedTypes[documentType].includes(ext)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				`Tipo de archivo no permitido para ${documentType}. Solo se permiten: ${allowedTypes[documentType].join(', ')}`,
			),
		);
	}
};

const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: {
		fileSize: 50 * 1024 * 1024,
	},
});

const handleUploadError = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				error: 'El archivo excede el tamaño máximo permitido (50MB)',
			});
		}
		return res.status(400).json({
			error: `Error en la carga del archivo: ${err.message}`,
		});
	}

	if (err) {
		return res.status(400).json({
			error: err.message,
		});
	}

	next();
};

module.exports = {
	upload,
	handleUploadError,
};
