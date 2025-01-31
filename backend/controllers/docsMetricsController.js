const DocsMetrics = require('../models/DocsMetrics');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');

exports.createDocsMetrics = [
    authMiddleware,
    async (req, res) => {
    try {
        const {
            documentID,
            documentType,
            ai_accuracy,
            ai_confidence_score,
            execution_time,
            ai_model_version = '5.24.5'
        } = req.body;

        if (!['Contract', 'ServiceDeliveryRecord', 'Invoice'].includes(documentType)) {
            return res.status(400).json({ error: 'Tipo de documento inválido' });
        }

        const docsMetrics = new DocsMetrics({
            documentID,
            documentType,
            ai_valid_method: 'Single Document', 
            ai_accuracy,
            ai_confidence_score,
            execution_time,
            ai_model_version,
        });

        const savedDocsMetrics = await docsMetrics.save();
        
        res.status(201).json({
            message: 'Métricas del documento creadas con éxito',
            data: savedDocsMetrics
        });
    } catch (error) {
        console.error('Error al crear las métricas del documento:', error);
        res.status(500).json({ error: 'Error al crear las métricas del documento' });
    }
}];

exports.getAllDocsMetrics = [
	authMiddleware,
	async (req, res) => {
		try {
			const docsMetrics = await DocsMetrics.find();
			res.status(200).json(docsMetrics);
		} catch (error) {
			console.error('Error al obtener las métricas AI:', error.message);
			res.status(500).json({ error: 'Error al obtener las métricas AI' });
		}
	},
];

exports.getDocsMetricsById = [
	authMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: 'ID de métricas AI inválido' });
			}

			const docsMetrics = await DocsMetrics.findById(id);
			if (!docsMetrics) {
				return res.status(404).json({ error: 'Métricas AI no encontradas' });
			}

			res.status(200).json(docsMetrics);
		} catch (error) {
			console.error('Error al obtener las métricas AI:', error);
			res.status(500).json({ error: 'Error al obtener las métricas AI' });
		}
	},
];

exports.updateDocsMetrics = [
	authMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;
			const { ai_model_version, ai_accuracy, ai_confidence_score, execution_time } = req.body;

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: 'ID de métricas AI inválido' });
			}

			const updatedDocsMetrics = await DocsMetrics.findByIdAndUpdate(
				id,
				{
					ai_model_version,
					ai_accuracy,
					ai_confidence_score,
					execution_time,
				},
				{ new: true },
			);

			if (!updatedDocsMetrics) {
				return res.status(404).json({ error: 'Métricas AI no encontradas' });
			}

			res.status(200).json(updatedDocsMetrics);
		} catch (error) {
			console.error('Error al actualizar las métricas AI:', error);
			res.status(500).json({ error: 'Error al actualizar las métricas AI' });
		}
	},
];
