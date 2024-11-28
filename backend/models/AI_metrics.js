const mongoose = require('mongoose');

const aiMetricsSchema = new mongoose.Schema({
	documentID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Document',
		required: true,
	},
	ai_accuracy: { type: Number, required: true },
	ai_confidence_score: { type: Number, required: true },
	false_positives: { type: Number, required: true },
	false_negatives: { type: Number, required: true },
	true_positives: { type: Number, required: true },
	true_negatives: { type: Number, required: true },
	execution_time: { type: Number, required: true },
	field_errors: {
		type: Map,
		of: { type: Number },
		default: {},
	},
	batch_id: { type: String, required: false },
	date_recorded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AiMetrics', aiMetricsSchema);
