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
	contract_number: {
		type: String,
		trim: true,
	},
	contract_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: true,
    },
	serviceDeliveryRecord_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'ServiceDeliveryRecord',
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
	missing_fields: [
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
	provider_ruc: {
		type: String,
		trim: true,
	},
	document_type: {
		type: String,
		trim: true,
		default: 'Factura',
	},
});

module.exports = mongoose.model('Invoice', invoiceSchema);
