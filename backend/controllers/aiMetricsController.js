/*
    Description: IA metrics Controller for create, get, update and delete metrics.
    By: Fabiana Liria
    version: 1.0
*/
const AiMetrics = require('../models/AI_metrics');
const mongoose = require('mongoose');

exports.createAiMetrics = async (req, res) => {
	try {
		const {
			validationID,
			ai_model_version,
			ai_accuracy,
			ai_confidence_score,
			false_positives,
			false_negatives,
			execution_time,
			ai_decision_explanation,
			human_review_needed,
		} = req.body;

		const aiMetrics = new AiMetrics({
			validationID,
			ai_model_version,
			ai_accuracy,
			ai_confidence_score,
			false_positives,
			false_negatives,
			execution_time,
			ai_decision_explanation,
			human_review_needed,
		});

		const savedAiMetrics = await aiMetrics.save();
		res.status(201).json(savedAiMetrics);
	} catch (error) {
		console.error('Error al crear las métricas AI:', error);
		res.status(500).json({ error: 'Error al crear las métricas AI' });
	}
};

exports.getAllAiMetrics = async (req, res) => {
	try {
		const aiMetrics = await AiMetrics.find().populate(
			'validationID',
			'document_type validation_status',
		);
		res.status(200).json(aiMetrics);
	} catch (error) {
		console.error('Error al obtener las métricas AI:', error);
		res.status(500).json({ error: 'Error al obtener las métricas AI' });
	}
};

exports.getAiMetricsById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de métricas AI inválido' });
		}

		const aiMetrics = await AiMetrics.findById(id).populate(
			'validationID',
			'document_type validation_status',
		);
		if (!aiMetrics) {
			return res.status(404).json({ error: 'Métricas AI no encontradas' });
		}

		res.status(200).json(aiMetrics);
	} catch (error) {
		console.error('Error al obtener las métricas AI:', error);
		res.status(500).json({ error: 'Error al obtener las métricas AI' });
	}
};

exports.updateAiMetrics = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			ai_model_version,
			ai_accuracy,
			ai_confidence_score,
			false_positives,
			false_negatives,
			execution_time,
			ai_decision_explanation,
			human_review_needed,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de métricas AI inválido' });
		}

		const updatedAiMetrics = await AiMetrics.findByIdAndUpdate(
			id,
			{
				ai_model_version,
				ai_accuracy,
				ai_confidence_score,
				false_positives,
				false_negatives,
				execution_time,
				ai_decision_explanation,
				human_review_needed,
			},
			{ new: true },
		);

		if (!updatedAiMetrics) {
			return res.status(404).json({ error: 'Métricas AI no encontradas' });
		}

		res.status(200).json(updatedAiMetrics);
	} catch (error) {
		console.error('Error al actualizar las métricas AI:', error);
		res.status(500).json({ error: 'Error al actualizar las métricas AI' });
	}
};

exports.deleteAiMetrics = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de métricas AI inválido' });
		}

		const deletedAiMetrics = await AiMetrics.findByIdAndDelete(id);
		if (!deletedAiMetrics) {
			return res.status(404).json({ error: 'Métricas AI no encontradas' });
		}

		res.status(200).json({ message: 'Métricas AI eliminadas correctamente' });
	} catch (error) {
		console.error('Error al eliminar las métricas AI:', error);
		res.status(500).json({ error: 'Error al eliminar las métricas AI' });
	}
};

exports.getAiMetricsByModelVersion = async (req, res) => {
	try {
		const { ai_model_version } = req.params;

		const aiMetrics = await AiMetrics.find({ ai_model_version }).populate(
			'validationID',
			'document_type validation_status',
		);
		if (!aiMetrics.length) {
			return res.status(404).json({
				error: 'No se encontraron métricas para esta versión de modelo AI',
			});
		}

		res.status(200).json(aiMetrics);
	} catch (error) {
		console.error(
			'Error al obtener las métricas AI por versión de modelo:',
			error,
		);
		res.status(500).json({
			error: 'Error al obtener las métricas AI por versión de modelo',
		});
	}
};
