const mongoose = require('mongoose');

const serviceDeliveryRecordSchema = new mongoose.Schema({
	hes_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
	},
	hes_number: {
		type: String,
		trim: true,
	},
	receiving_company: {
		type: String,
		trim: true,
	},
	contract_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: true,
    },
	start_date: {
		type: Date,
	},
	end_date: {
		type: Date,
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
	invoice_number: {
		type: String,
		trim: true,
	},
	order_number: {
		type: String,
		trim: true,
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
	provider_ruc: {
		type: String,
		trim: true,
	},
	document_type: {
		type: String,
		trim: true,
		default: 'Acta de entrega',
	},
});

module.exports = mongoose.model(
	'ServiceDeliveryRecord',
	serviceDeliveryRecordSchema,
);
