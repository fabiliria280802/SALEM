const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
	user_id: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	notification_type: {
		type: String,
		enum: ['Validation', 'Error', 'Information'],
		required: true,
	},
	message: { type: String, required: true },
	status: { type: String, enum: ['Read', 'Unread'], default: 'Unread' },
	sent_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
