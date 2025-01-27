const AiMetrics = require('../models/AI_metrics');
const mongoose = require('mongoose');

// Crear métricas de IA
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

// Obtener estadísticas generales de IA
exports.getAiStats = async (req, res) => {
    try {
        const stats = await AiMetrics.aggregate([
            {
                $group: {
                    _id: null,
                    avgAccuracy: { $avg: "$ai_accuracy" },
                    avgExecutionTime: { $avg: "$execution_time" },
                    fieldErrors: { $push: "$field_errors" },
                },
            },
            {
                $project: {
                    _id: 0,
                    avgAccuracy: 1,
                    avgExecutionTime: 1,
                    fieldErrors: {
                        $reduce: {
                            input: { $objectToArray: { $mergeObjects: "$fieldErrors" } },
                            initialValue: {},
                            in: {
                                $mergeObjects: [
                                    "$$value",
                                    {
                                        k: "$$this.k",
                                        v: { $sum: ["$$this.v", 1] },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        ]);

        const mostFrequentErrors = stats[0]?.fieldErrors
            ? Object.entries(stats[0].fieldErrors)
                  .map(([field, count]) => ({ field, count }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
            : [];

        res.status(200).json({
            avgAccuracy: stats[0]?.avgAccuracy || 0,
            avgExecutionTime: stats[0]?.avgExecutionTime || 0,
            mostFrequentErrors,
        });
    } catch (error) {
        console.error('Error al obtener las estadísticas de IA:', error);
        res.status(500).json({ error: 'Error al obtener las estadísticas de IA' });
    }
};

// Obtener todas las métricas de IA
exports.getAllAiMetrics = async (req, res) => {
<<<<<<< Updated upstream
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

=======
    try {
        const aiMetrics = await AiMetrics.find();
        res.status(200).json(aiMetrics);
    } catch (error) {
        console.error('Error al obtener las métricas AI:', error.message);
        res.status(500).json({ error: 'Error al obtener las métricas AI' });
    }
};

// Obtener métricas de IA por ID
>>>>>>> Stashed changes
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

// Actualizar métricas de IA
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

// Eliminar métricas de IA
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
