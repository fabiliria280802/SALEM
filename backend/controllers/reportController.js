/*
    Description: Report logic for IA efficiency
    By: Fabiana Liria
    version: 1.0
*/

const Report = require('../models/Report');
const mongoose = require('mongoose');

exports.createReport = async (req, res) => {
	try {
		const {
			document_type,
			document_count,
			approved_documents,
			rejected_documents,
			user_id,
		} = req.body;

		if (!['Invoice', 'Hes', 'Migo'].includes(document_type)) {
			return res.status(400).json({ error: 'Tipo de documento inválido' });
		}

		if (document_count !== approved_documents + rejected_documents) {
			return res.status(400).json({
				error:
					'La suma de documentos aprobados y rechazados debe ser igual al total de documentos',
			});
		}

		const report = new Report({
			document_type,
			document_count,
			approved_documents,
			rejected_documents,
			user_id,
		});

		const savedReport = await report.save();
		res.status(201).json(savedReport);
	} catch (error) {
		console.error('Error al crear el reporte:', error);
		res.status(500).json({ error: 'Error al crear el reporte' });
	}
};

exports.getAllReports = async (req, res) => {
	try {
		const reports = await Report.find().populate('user_id', 'name email');
		res.status(200).json(reports);
	} catch (error) {
		console.error('Error al obtener los reportes:', error);
		res.status(500).json({ error: 'Error al obtener los reportes' });
	}
};

exports.getReportById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de reporte inválido' });
		}

		const report = await Report.findById(id).populate('user_id', 'name email');
		if (!report) {
			return res.status(404).json({ error: 'Reporte no encontrado' });
		}

		res.status(200).json(report);
	} catch (error) {
		console.error('Error al obtener el reporte:', error);
		res.status(500).json({ error: 'Error al obtener el reporte' });
	}
};

exports.updateReport = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			document_type,
			document_count,
			approved_documents,
			rejected_documents,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de reporte inválido' });
		}

		if (document_type && !['Invoice', 'Hes', 'Migo'].includes(document_type)) {
			return res.status(400).json({ error: 'Tipo de documento inválido' });
		}

		if (document_count !== approved_documents + rejected_documents) {
			return res.status(400).json({
				error:
					'La suma de documentos aprobados y rechazados debe ser igual al total de documentos',
			});
		}

		const updatedReport = await Report.findByIdAndUpdate(
			id,
			{ document_type, document_count, approved_documents, rejected_documents },
			{ new: true },
		);

		if (!updatedReport) {
			return res.status(404).json({ error: 'Reporte no encontrado' });
		}

		res.status(200).json(updatedReport);
	} catch (error) {
		console.error('Error al actualizar el reporte:', error);
		res.status(500).json({ error: 'Error al actualizar el reporte' });
	}
};

exports.deleteReport = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de reporte inválido' });
		}

		const deletedReport = await Report.findByIdAndDelete(id);
		if (!deletedReport) {
			return res.status(404).json({ error: 'Reporte no encontrado' });
		}

		res.status(200).json({ message: 'Reporte eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar el reporte:', error);
		res.status(500).json({ error: 'Error al eliminar el reporte' });
	}
};

exports.getReportStats = async (req, res) => {
	try {
		const stats = await Report.aggregate([
			{
				$group: {
					_id: '$document_type',
					total_documents: { $sum: '$document_count' },
					total_approved: { $sum: '$approved_documents' },
					total_rejected: { $sum: '$rejected_documents' },
				},
			},
		]);

		res.status(200).json(stats);
	} catch (error) {
		console.error('Error al obtener estadísticas de reportes:', error);
		res
			.status(500)
			.json({ error: 'Error al obtener estadísticas de reportes' });
	}
};
