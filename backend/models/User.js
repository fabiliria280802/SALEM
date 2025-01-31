const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const validateEcuadorianCedula = cedula => {
	if (cedula.length !== 10) return false;

	const provinceCode = parseInt(cedula.slice(0, 2), 10);
	const thirdDigit = parseInt(cedula[2], 10);

	if (provinceCode < 1 || provinceCode > 24) return false;

	if (thirdDigit >= 6) return false;

	const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
	let total = 0;

	for (let i = 0; i < 9; i++) {
		let result = cedula[i] * coefficients[i];
		if (result >= 10) result -= 9;
		total += result;
	}

	const verifierDigit = (10 - (total % 10)) % 10;
	return verifierDigit === parseInt(cedula[9], 10);
};

const validateRUC = ruc => {
	if (ruc.length !== 13) return false;

	const provinceCode = parseInt(ruc.slice(0, 2), 10);
	const thirdDigit = parseInt(ruc[2], 10);

	if (provinceCode < 1 || provinceCode > 24) return false;

	if (thirdDigit === 9) {
		return ruc.slice(10, 13) === '001';
	}

	if (thirdDigit === 6) {
		return ruc.slice(10, 13) === '001';
	}

	if (thirdDigit < 6 && validateEcuadorianCedula(ruc.slice(0, 10))) {
		return ruc.slice(10, 13) === '001';
	}

	return false;
};

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'El campo "Nombres" es obligatorio.'],
		validate: {
			validator: value => validator.isAlpha(value, 'es-ES', { ignore: ' ' }),
			message: 'El nombre solo debe contener letras y espacios.',
		},
		set: value => validator.escape(value),
	},
	last_name: {
		type: String,
		required: [true, 'El campo "Apellidos" es obligatorio.'],
		validate: {
			validator: value => validator.isAlpha(value, 'es-ES', { ignore: ' ' }),
			message: 'El nombre solo debe contener letras y espacios.',
		},
		set: value => validator.escape(value),
	},
	phone: {
		type: String,
		required: [true, 'El campo "Telefono" es obligatorio.'],
		validate: {
			validator: value =>
				validator.isNumeric(value) &&
				validator.isLength(value, { min: 10, max: 10 }),
			message: 'El número de teléfono debe tener exactamente 10 dígitos.',
		},
		set: value => validator.escape(value),
	},
	company_name: {
		type: String,
		required: [true, 'El campo "Empresa" es obligatorio.'],
		validate: {
			validator: value => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value),
			message:
				'El nombre de la empresa no puede contener caracteres especiales ni números.',
		},
		set: value => validator.escape(value),
	},
	ruc: {
		type: String,
		required: [true, 'El campo "Ruc" es obligatorio.'],
		validate: {
			validator: validateRUC,
			message: 'El RUC ingresado no es válido.',
		},
		set: value => validator.escape(value),
	},
	email: {
		type: String,
		required: [true, 'El campo "Correo" es obligatorio.'],
		unique: true,
		validate: {
			validator: value => validator.isEmail(value),
			message: 'El correo electrónico ingresado no es válido.',
		},
		set: value => validator.normalizeEmail(value),
	},
	password: {
		type: String,
	},
	role: {
		type: String,
		required: [true, 'El campo "Rol" es obligatorio.'],
		enum: ['Administrador', 'Gestor', 'Proveedor'],
		default: 'Proveedor',
	},
	register_date: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ['Activo', 'Inactivo'],
		default: 'Activo',
	},
	resetCode: {
		type: String,
		default: null,
	},
	last_login: {
		type: Date,
	},
	created_by: {
		type: String,
		default: 'System',
	},
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		return next();
	}
	const salt = await bcrypt.genSalt(10);
	this.password = await bcrypt.hash(this.password, salt);
	next();
});

module.exports = mongoose.model('User', userSchema);
