const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
		required: true,
	},
	invoice_number: {
		type: String,
		required: [true, 'El número de factura es requerido'],
		unique: true,
		match: [/^invoice-\d{6}$/, 'El formato del número de factura debe ser invoice-XXXXXX']
	},
	issue_date: {
		type: Date,
		required: [true, 'La fecha de emisión es requerida']
	},
	issuing_company: {
		type: String,
		required: [true, 'La empresa emisora es requerida'],
		trim: true
	},
	receiving_company: {
		type: String,
		required: [true, 'La empresa receptora es requerida'],
		trim: true
	},
	service: {
		type: String,
		required: [true, 'El servicio es requerido'],
		trim: true
	},
	subtotal: {
		type: Number,
		required: [true, 'El subtotal es requerido'],
		min: [0, 'El subtotal no puede ser negativo']
	},
	discount_percentage: {
		type: Number,
		required: true,
		enum: [0, 5, 10, 15, 20],
		default: 0
	},
	discount: {
		type: Number,
		required: true,
		default: 0
	},
	subtotal_with_discount: {
		type: Number,
		required: true
	},
	vat: {
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
		enum: ['Accepted', 'Denied', 'Pending', 'Revalidation'],
		default: 'Pending'
	}
});

module.exports = mongoose.model('Invoice', invoiceSchema);
