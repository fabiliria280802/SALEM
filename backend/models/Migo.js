const mongoose = require('mongoose');

const itemDetailSchema = new mongoose.Schema({
	quantity: {
		type: Number
	},
	description: {
		type: String
	},
	unit_price: {
		type: Number
	},
	total_price: {
		type: Number
	}
});

const migoSchema = new mongoose.Schema({
	document_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
		required: true
	},
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	title: {
		type: String
	},
	migo_number: {
		type: String,
		unique: true,
		match: /^MIGO\d{3,}-\w+$/
	},
	date: {
		type: Date
	},
	client: {
		type: String
	},
	address: {
		type: String
	},
	item_details: [itemDetailSchema],
	client_signature: {
		type: String
	},
	observations: {
		type: String
	}
}, {
	timestamps: true
});

module.exports = mongoose.model('MIGO', migoSchema);
