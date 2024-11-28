/*
    Description: Authentication logic for login and get user profile.
    By: Fabiana Liria
    version: 1.8
*/
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	try {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
			const error = new Error('El correo electrónico ingresado no es válido');
			error.statusCode = 406;
			return next(error);
		}

		const user = await User.findOne({ email });
		if (!user) {
			const error = new Error(
				'El correo electrónico ingresado no esta registrado en el sistema',
			);
			error.statusCode = 404;
			return next(error);
		}

		if (user.status === 'Inactivo') {
			const error = new Error(
				'El usuario está desactivado y no puede acceder al sistema',
			);
			error.statusCode = 403;
			return next(error);
		}

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			const error = new Error('Contraseña incorrecta');
			error.statusCode = 401;
			return next(error);
		}
		await User.updateOne({ _id: user._id }, { last_login: Date.now() });
		const token = jwt.sign(
			{
				id: user._id,
				name: user.name,
				last_name: user.last_name,
				email: user.email,
				role: user.role,
				company_name: user.company_name,
				ruc: user.ruc,
				phone: user.phone,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '10h' },
		);

		res.json({
			token,
			user: {
				id: user._id,
				name: user.name,
				last_name: user.last_name,
				email: user.email,
				role: user.role,
				company_name: user.company_name,
				ruc: user.ruc,
				phone: user.phone,
				register_date: user.register_date,
				status: user.status,
				last_login: Date.now(),
			},
		});
	} catch (error) {
		next(error);
	}
};
