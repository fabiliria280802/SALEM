const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const serviceDeliveryRecordSchema = new mongoose.Schema({
	contract_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
	delivery_date: { type: Date, required: true },
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación'],
		required: true,
	},
});

module.exports = mongoose.model(
	'ServiceDeliveryRecord',
	serviceDeliveryRecordSchema,
);
