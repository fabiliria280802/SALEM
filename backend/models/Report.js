const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
	document_type: {
		type: String,
		enum: ['Invoice', 'Hes', 'Migo'],
		required: true,
	},
	document_summary: [
		{
			date: { type: Date, required: true },
			count: { type: Number, required: true },
		},
	],
	approved_documents: { type: Number, required: true },
	rejected_documents: { type: Number, required: true },
	generation_date: { type: Date, default: Date.now },
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Report', reportSchema);
