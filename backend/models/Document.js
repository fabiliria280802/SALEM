const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
	number: { type: String, required: true },
	register_date: { type: Date, required: true },
	type: {
		type: String,
		enum: ['HES', 'MIGO'],
		required: true,
	}, 
});

module.exports = mongoose.model('Document', documentSchema, 'documents');
