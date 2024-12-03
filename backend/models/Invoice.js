const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
		required: true,
	},
	factura_number: {
		type: String,
		required: [true, 'El número de factura es requerido'],
		unique: true,
		match: [/^invoice-\d{6}$/, 'El formato del número de factura debe ser invoice-XXXXXX']
	},
	fecha_emision: {
		type: Date,
		required: [true, 'La fecha de emisión es requerida']
	},
	empresa_emisora: {
		type: String,
		required: [true, 'La empresa emisora es requerida'],
		trim: true
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
	subtotal: {
		type: Number,
		required: [true, 'El subtotal es requerido'],
		min: [0, 'El subtotal no puede ser negativo']
	},
	descuento_porcentaje: {
		type: Number,
		required: true,
		enum: [0, 5, 10, 15, 20],
		default: 0
	},
	descuento: {
		type: Number,
		required: true,
		default: 0
	},
	subtotal_con_descuento: {
		type: Number,
		required: true
	},
	iva: {
		type: Number,
		required: true
	},
	total: {
		type: Number,
		required: true
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'El creador de la factura es requerido']
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación'],
		default: 'Pendiente'
	}
});

module.exports = mongoose.model('Invoice', invoiceSchema);
