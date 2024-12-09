const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
	contract_number: {
		type: String,
		required: [true, 'The contract number is required'],
		unique: true,
		match: [/^contract-\d{4}$/, 'The format of the contract number must be contract-XXXX']
	},
	contracting_company: {
		type: String,
		required: [true, 'The contracting company is required'],
		trim: true
	},
	contracted_company: {
		type: String,
		required: [true, 'The contracted company is required'],
		trim: true
	},
	service: {
		type: String,
		required: [true, 'The service is required'],
		trim: true
	},
	start_date: {
		type: Date,
		required: [true, 'The start date is required']
	},
	end_date: {
		type: Date,
		required: [true, 'The end date is required'],
		validate: {
			validator: function(end_date) {
				return end_date >= this.start_date;
			},
			message: 'The end date must be after or equal to the start date'
		}
	},
	created_by: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'The creator of the contract is required']
	},
	created_at: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		enum: ['Accepted', 'Denied', 'Pending', 'Revalidation'],
		required: true
	}
});

module.exports = mongoose.model('Contract', contractSchema);
