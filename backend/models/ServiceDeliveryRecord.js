const mongoose = require('mongoose');

const firmaSchema = new mongoose.Schema({
	nombre: {
		type: String,
		required: [true, 'El nombre es requerido'],
		match: [/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'El nombre solo debe contener letras y espacios']
	},
	cargo: {
		type: String,
		required: [true, 'El cargo es requerido'],
		match: [/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'El cargo solo debe contener letras y espacios']
	},
	tipo: {
		type: String,
		required: [true, 'El tipo de firma es requerido'],
		enum: ['Proveedor', 'Receptor']
	}
});

const serviceDeliveryRecordSchema = new mongoose.Schema({
	hes_number: {
		type: String,
		required: [true, 'El número de HES es requerido'],
		unique: true,
		match: [/^record-\d{3}$/, 'El formato del número de HES debe ser record-XXX']
	},
	empresa_receptora: {
		type: String,
		required: [true, 'La empresa receptora es requerida'],
		trim: true
	},
	servicio: {
		type: String,
		required: [true, 'El servicio es requerido'],
		trim: true
	},
	ubicacion: {
		type: String,
		required: [true, 'La ubicación del servicio es requerida'],
		trim: true
	},
	firmas: {
		type: [firmaSchema],
		validate: {
			validator: function(firmas) {
				return firmas.length === 2;
			},
			message: 'Se requieren exactamente dos firmas (Proveedor y Receptor)'
		}
	},
	contrato: {
		type: String,
		required: [true, 'El número de contrato es requerido'],
		match: [/^contract-\d{4}$/, 'El formato del número de contrato debe ser contract-XXXX']
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
		required: [true, 'El creador del registro es requerido']
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación'],
		required: true,
	},
});

module.exports = mongoose.model('ServiceDeliveryRecord', serviceDeliveryRecordSchema);
