const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const contractSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	create_date: { type: Date, required: true },
	number: { type: String, required: true },
	status: {
		type: String,
		enum: ['Aceptado', 'Denegado', 'Pendiente', 'Revalidación'],
		required: true,
	},
});

module.exports = mongoose.model('Contract', contractSchema);
