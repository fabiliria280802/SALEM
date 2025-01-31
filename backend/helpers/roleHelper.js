const isAdmin = (req, res, next) => {
	if (req.user.role !== 'Administrador') {
		return res
			.status(403)
			.json({ message: 'No autorizado, debes ser Administrador' });
	}
	next();
};

const isManager = (req, res, next) => {
	if (req.user.role !== 'Gestor') {
		return res.status(403).json({ message: 'No autorizado, debes ser Gestor' });
	}
	next();
};

const isClient = (req, res, next) => {
	if (req.user.role !== 'Proveedor') {
		return res
			.status(403)
			.json({ message: 'No autorizado, debes ser Cliente' });
	}
	next();
};

module.exports = {
	isAdmin,
	isManager,
	isClient,
};
