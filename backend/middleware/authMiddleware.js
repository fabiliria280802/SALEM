const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
	const authHeader = req.header('Authorization');

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res
			.status(401)
			.json({ message: 'Acceso denegado. No se proporcionó token válido.' });
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'Token no encontrado.' });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		console.error('Error al verificar el token:', error);
		return res.status(403).json({ message: 'Token no válido.' });
	}
};

module.exports = authMiddleware;
