const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
	contrato_number: {
		type: String,
		required: [true, 'El número de contrato es requerido'],
		unique: true,
		match: [/^contract-\d{4}$/, 'El formato del número de contrato debe ser contract-XXXX']
	},
	empresa_contratante: {
		type: String,
		required: [true, 'La empresa contratante es requerida'],
		trim: true
	},
	empresa_contratada: {
		type: String,
		required: [true, 'La empresa contratada es requerida'],
		trim: true
	},
	servicio: {
		type: String,
		required: [true, 'El servicio es requerido'],
		trim: true
	},
	fecha_inicio: {
		type: Date,
		required: [true, 'La fecha de inicio es requerida']
	},
	fecha_termino: {
		type: Date,
		required: [true, 'La fecha de término es requerida'],
		validate: {
			validator: function(fecha_termino) {
				return fecha_termino >= this.fecha_inicio;
			},
			message: 'La fecha de término debe ser posterior o igual a la fecha de inicio'
		}
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'El creador del contrato es requerido']
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación'],
		required: true
	}
});

module.exports = mongoose.model('Contract', contractSchema);
