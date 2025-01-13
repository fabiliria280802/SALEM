const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
	},
	invoice_number: {
		type: String,
		trim: true,
	},
	issue_date: {
		type: Date,
	},
	issuing_company: {
		type: String,
		trim: true,
	},
	receiving_company: {
		type: String,
		trim: true,
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación', 'Analizando'],
		default: 'Pendiente',
	},
	ai_decision_explanation: {
		type: String,
	},
	missing_errors: [
		{
			type: String,
		},
	],
	validation_errors: [
		{
			type: String,
		},
	],
	file_path: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('Invoice', invoiceSchema);
