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
    const allowedExtensions = ['.pdf', '.png', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
        return cb(
            new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedExtensions.join(', ')}`),
        );
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
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
