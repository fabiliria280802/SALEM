const mongoose = require('mongoose');

const aiMetricsSchema = new mongoose.Schema({
	ai_valid_method: {		
		type: String,
		default: 'Several Documents'},
	ai_accuracy: { type: Number, required: true },
	ai_confidence_score: { type: Number, required: true },
	total_train_docs: { type: Number, required: true },
	total_valid_docs: { type: Number, required: true },
	total_false_positives: { type: Number, required: true },
	total_false_negatives: { type: Number, required: true },
	total_true_positives: { type: Number, required: true },
	total_true_negatives: { type: Number, required: true },
	execution_time: { type: Number, required: true },
	ai_model_version: { type: String, default:'5.24.5' },
	batch_id: { type: String, default:'BATCH24'},
	date_recorded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AiMetrics', aiMetricsSchema, 'aimetrics');
