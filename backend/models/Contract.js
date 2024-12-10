const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
	contract_number: {
		type: String,
		unique: true
	},
	contracting_company: {
		type: String,
		trim: true
	},
	contracted_company: {
		type: String,
		trim: true
	},
	service: {
		type: String,
		trim: true
	},
	start_date: {
		type: Date
	},
	end_date: {
		type: Date
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

module.exports = mongoose.model('Contract', contractSchema);
