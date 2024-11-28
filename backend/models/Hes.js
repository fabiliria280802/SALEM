const mongoose = require('mongoose');

const hesSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
		required: true,
	},
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	title: {
		type: String
	},
	receiving_company: {
		type: String
	},
	order_number: {
		type: String
	},
	start_date: {
		type: Date
	},
	end_date: {
		type: Date
	},
	service_location: {
		type: String
	},
	service_description: {
		type: String
	},
	observations: {
		type: String,
	},
	signatures: [
		{
			first_name: { type: String },
			title_and_full_name: { type: String },
			role: { type: String },
		},
	],
});

module.exports = mongoose.model('HES', hesSchema);