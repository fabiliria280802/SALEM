const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document'
	},
	invoice_number: {
		type: String,
		unique: true
	},
	issue_date: {
		type: Date
	},
	issuing_company: {
		type: String,
		trim: true
	},
	receiving_company: {
		type: String,
		trim: true
	},
	service: {
		type: String,
		trim: true
	},
	subtotal: {
		type: Number
	},
	discount_percentage: {
		type: Number,
		default: 0
	},
	discount: {
		type: Number,
		default: 0
	},
	subtotal_with_discount: {
		type: Number
	},
	iva: {
		type: Number
	},
	total: {
		type: Number
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación', 'Analizando'],
		default: 'Pendiente'
	},
	ai_decision_explanation: {
		type: String
	},
	validation_errors: [{
		type: String
	}],
	file_path: {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('Invoice', invoiceSchema);
