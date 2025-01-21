const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
	provider_ruc: {
		type: String,
		trim: true,
	},
	contract_number: {
		type: String,
		trim: true,
	},
	contract_type: {
		type: String,
		trim: true,
	},
	contracted_company: {
		type: String,
		trim: true,
	},
	service: {
		type: String,
		trim: true,
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
	document_type: {
		type: String,
		trim: true,
		default: 'Contrato',
	},
});

module.exports = mongoose.model('Contract', contractSchema);
