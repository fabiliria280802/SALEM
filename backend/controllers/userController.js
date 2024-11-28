/*
    Description: Authentication logic for login and get user profile
    By: Fabiana Liria
    version: 2.0
*/

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const {
	sendPasswordCreationEmail,
	sendPasswordResetEmail,
} = require('../controllers/notificationController');
const mongoose = require('mongoose');
const { isAdmin } = require('../helpers/roleHelper');

exports.createUser = [
	authMiddleware,
	isAdmin,
	async (req, res, next) => {
		const { name, last_name, phone, company_name, ruc, email, role } = req.body;

		try {
			const existingUser = await User.findOne({ email });

			if (existingUser) {
				const error = new Error('El usuario ya existe');
				error.statusCode = 400;
				return next(error);
			}

			const adminName = req.user.name;
			const adminLastName = req.user.last_name;
			const createdBy = `${adminName} ${adminLastName}`;

			const newUser = new User({
				name,
				last_name,
				phone,
				company_name,
				ruc,
				email,
				role,
				created_by: createdBy,
			});

			await newUser.save();

			await sendPasswordCreationEmail(newUser);
			const userResponse = {
				name: newUser.name,
				last_name: newUser.last_name,
				phone: newUser.phone,
				company_name: newUser.company_name,
				ruc: newUser.ruc,
				email: newUser.email,
				role: newUser.role,
				created_by: newUser.created_by,
			};

			res.status(201).json({
				message:
					'Usuario creado exitosamente. Se ha enviado un correo para la creación de la contraseña.',
				user: userResponse,
			});
		} catch (error) {
			if (error.name === 'ValidationError') {
				const errors = Object.values(error.errors).map(err => err.message);
				return res
					.status(400)
					.json({ message: 'Errores de validación', errors });
			}
			res.status(500).json({
				message: 'Error al crear el usuario',
				errors: ['Error desconocido al crear el usuario'],
			});
		}
	},
];

exports.getAllUsers = [
	authMiddleware,
	isAdmin,
	async (req, res, next) => {
		try {
			const users = await User.find().select('-password');
			res.json(users);
		} catch (error) {
			next(error);
		}
	},
];

exports.getAUser = [
	authMiddleware,
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const user = await User.findById(id);

			if (!user) {
				return res.status(404).json({ message: 'Usuario no encontrado' });
			}
			return res.status(200).json(user);
		} catch (error) {
			return res.status(500).json({ message: 'Error al obtener el usuario' });
		}
	},
];

exports.getUserByEmail = async (req, res) => {
	try {
		const user = await User.findOne({ email: req.params.email });
		if (!user) {
			return res.status(404).json({
				message:
					'El correo electrónico ingresado no esta registrado en el sistema',
				error: error.message,
			});
		}
		await sendPasswordResetEmail(user);
		res.status(200).json({ message: 'Correo enviado correctamente' });
	} catch (error) {
		res.status(500).json({
			message: 'Error al procesar la solicitud',
			error: error.message,
		});
	}
};

exports.updateUser = [
	authMiddleware,
	isAdmin,
	async (req, res, next) => {
		const { id } = req.params;
		const { phone, company_name, ruc, email, role, status, name, last_name } =
			req.body;
		try {
			const user = await User.findById(id);

			if (!user) {
				const error = new Error('Usuario no encontrado');
				error.statusCode = 404;
				return next(error);
			}
			user.phone = phone || user.phone;
			user.company_name = company_name || user.company_name;
			user.ruc = ruc || user.ruc;
			user.email = email || user.email;
			user.role = role || user.role;
			user.status = status || user.status;
			user.name = name || user.name;
			user.last_name = last_name || user.last_name;

			await user.save();
			res.json({ message: 'Usuario actualizado exitosamente', user });
		} catch (error) {
			if (error.name === 'ValidationError') {
				const errors = Object.values(error.errors).map(err => err.message);
				return res
					.status(400)
					.json({ message: 'Errores de validación', errors });
			}
			res.status(500).json({
				message: 'Error al crear el usuario',
				errors: ['Error desconocido al crear el usuario'],
			});
		}
	},
];

exports.suspendUser = [
	authMiddleware,
	isAdmin,
	async (req, res, next) => {
		const { id } = req.params;

		try {
			const user = await User.findById(id);

			if (!user) {
				const error = new Error('Usuario no encontrado');
				error.statusCode = 404;
				return next(error);
			}

			user.status = 'Inactivo';
			await user.save();

			res.json({ message: 'Usuario desactivado exitosamente' });
		} catch (error) {
			next(error);
		}
	},
];

exports.changePassword = [
	authMiddleware,
	async (req, res, next) => {
		const { currentUserId, userIdToModify } = req.params;
		const { currentPassword, newPassword } = req.body;

		try {
			if (
				!mongoose.Types.ObjectId.isValid(currentUserId) ||
				!mongoose.Types.ObjectId.isValid(userIdToModify)
			) {
				return res.status(400).json({ message: 'ID inválido' });
			}

			const userToModify = await User.findById(userIdToModify);

			if (!userToModify) {
				return res.status(404).json({ message: 'Usuario no encontrado' });
			}

			if (currentUserId === userIdToModify) {
				const isMatch = await bcrypt.compare(
					currentPassword,
					userToModify.password,
				);

				if (!isMatch) {
					return res
						.status(401)
						.json({ message: 'La contraseña actual es incorrecta' });
				}

				const salt = await bcrypt.genSalt(10);
				userToModify.password = await bcrypt.hash(newPassword, salt);
				await userToModify.save();

				return res.json({ message: 'Contraseña actualizada exitosamente' });
			}

			if (
				req.user.role === 'Administrador' &&
				currentUserId !== userIdToModify
			) {
				await sendPasswordCreationEmail(userToModify);
				return res.json({
					message:
						'Correo enviado para que el usuario cree una nueva contraseña.',
				});
			}

			return res.status(403).json({ message: 'No autorizado' });
		} catch (error) {
			if (error.name === 'ValidationError') {
				const errors = Object.values(error.errors).map(err => err.message);
				return res
					.status(400)
					.json({ message: 'Errores de validación', errors });
			}
			res.status(500).json({
				message: 'Error al crear el usuario',
				errors: ['Error desconocido al crear el usuario'],
			});
		}
	},
];

exports.verifyResetCode = async (req, res) => {
	const { email, code } = req.body;

	if (!email || !code) {
		return res
			.status(400)
			.json({ message: 'Faltan datos requeridos: email o código.' });
	}
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	if (!emailRegex.test(email)) {
		return res
			.status(406)
			.json({ message: 'El correo electrónico ingresado no es válido' });
	}

	try {
		const user = await User.findOne({ email });
		if (!user || user.resetCode !== code) {
			return res
				.status(404)
				.json({ message: 'Código incorrecto o no encontrado' });
		}
		res
			.status(200)
			.json({ message: 'Código verificado correctamente', userId: user._id });
	} catch (error) {
		res.status(500).json({ message: 'Error al verificar el código', error });
	}
};

//TODO: PASAR EL CREATE PASSWORD A USERCONTROLLER.JS
exports.createPassword = [];

exports.getUserByRuc = async (req, res) => {
	try {
		const { ruc } = req.params;
		const user = await User.findOne({ ruc });

		if (!user) {
			console.log('No se encontró ningún usuario con ese RUC');
			return res.status(404).json({
				error: 'No se encontró ningún usuario con ese RUC',
			});
		}
		console.log('usuario encontrado');
		res.status(200).json(user);
	} catch (error) {
		console.error('Error al buscar usuario por RUC:', error);
		console.log('Error al buscar usuario por RUC');

		res.status(500).json({
			error: 'Error al buscar usuario por RUC',
		});
	}
};
