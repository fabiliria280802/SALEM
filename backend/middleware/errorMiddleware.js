const errorMiddleware = (err, req, res, next) => {
	// Solo registrar errores si no estamos en un entorno de prueba
	if (process.env.NODE_ENV !== 'test') {
		console.error(err.stack);
	}

	const statusCode = err.statusCode || 500;
	const message = err.message || 'Ocurrió un error inesperado en el servidor';

	res.status(statusCode).json({
		success: false,
		message: message,
		error: statusCode === 500 ? 'Error del servidor' : err.message,
	});
};

module.exports = errorMiddleware;

