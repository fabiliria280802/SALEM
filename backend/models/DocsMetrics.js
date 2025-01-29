const mongoose = require('mongoose');

const docsMetricsSchema = new mongoose.Schema({
	documentID: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		refPath: 'documentType',
	},
	documentType: {
		type: String,
		required: true,
		enum: ['Contract', 'ServiceDeliveryRecord','Invoice'], 
	},
    ai_valid_method: {		
		type: String,
		default: 'Single Document'},
	ai_accuracy: { type: Number, required: true },
	ai_confidence_score: { type: Number, required: true },
	execution_time: { type: Number, required: true },
	ai_model_version: { type: String, default: '5.24.5' },
	date_recorded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('DocsMetrics', docsMetricsSchema, 'docsmetrics');
