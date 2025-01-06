const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
	name: {
		type: String,
	},
	position: {
		type: String,
	},
	type: {
		type: String,
		enum: ['Provider', 'Receiver'],
	},
});

const serviceDeliveryRecordSchema = new mongoose.Schema({
	hes_number: {
		type: String,
		unique: true,
	},
	receiving_company: {
		type: String,
		trim: true,
	},
	service: {
		type: String,
		trim: true,
	},
	location: {
		type: String,
		trim: true,
	},
	signatures: {
		type: [signatureSchema],
	},
	contract: {
		type: String,
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

module.exports = mongoose.model(
	'ServiceDeliveryRecord',
	serviceDeliveryRecordSchema,
);
