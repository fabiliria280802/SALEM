/*
    Description: ServiceDeliveryRecord Controller for create, get, update and delete services.
    By: Fabiana Liria
    version: 1.0
*/
const ServiceDeliveryRecord = require('../models/ServiceDeliveryRecord');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

exports.createServiceDeliveryRecord = [
	authMiddleware,
	async (req, res) => {
		try {
			const {
				hes_number,
				receiving_company,
				service,
				location,
				names,
				positions,
				contract,
				start_date,
				end_date,
			} = req.body;

			const newRecord = new ServiceDeliveryRecord({
				hes_number,
				receiving_company,
				service,
				location,
				signatures: [
					{
						name: names[0],
						position: positions[0],
						type: 'Provider',
					},
					{
						name: names[1],
						position: positions[1],
						type: 'Receiver',
					},
				],
				contract,
				start_date,
				end_date,
				created_by: req.user.id,
				status: 'Pending',
			});

			const savedRecord = await newRecord.save();
			res.status(201).json(savedRecord);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];

exports.getAllServiceDeliveryRecords = [
	authMiddleware,
	async (req, res) => {
		try {
			const records = await ServiceDeliveryRecord.find();
			res.status(200).json(records);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];

exports.getServiceDeliveryRecordById = [
	authMiddleware,
	async (req, res) => {
		try {
			const record = await ServiceDeliveryRecord.findById(req.params.id);
			if (!record) {
				return res.status(404).json({ message: 'Registro no encontrado' });
			}
			res.status(200).json(record);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];

exports.updateServiceDeliveryRecord = [
	authMiddleware,
	async (req, res) => {
		try {
			const updatedRecord = await ServiceDeliveryRecord.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!updatedRecord) {
				return res.status(404).json({ message: 'Registro no encontrado' });
			}
			res.status(200).json(updatedRecord);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];

exports.deleteServiceDeliveryRecord = [
	authMiddleware,
	async (req, res) => {
		try {
			const deletedRecord = await ServiceDeliveryRecord.findByIdAndDelete(
				req.params.id,
			);
			if (!deletedRecord) {
				return res.status(404).json({ message: 'Registro no encontrado' });
			}
			res.status(200).json({ message: 'Registro eliminado exitosamente' });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];

exports.createServiceRecord = [
	authMiddleware,
	async (req, res) => {
		try {
			const { ruc, contract, documentType } = req.body;
			const file = req.file;

			if (!file) {
				return res
					.status(400)
					.json({ error: 'No se ha proporcionado un archivo' });
			}

			const newRecord = new ServiceDeliveryRecord({
				contract: contract,
				file_path: path.join('data', file.filename),
				status: 'Analizando',
				created_by: req.user.id,
			});

			await newRecord.save();

			const filePath = newRecord.file_path;
			const pythonProcess = spawn('python', [
				'controllers/IA/ia.py',
				filePath,
				documentType,
			]);

			let pythonOutput = '';

			pythonProcess.stdout.on('data', data => {
				pythonOutput += data.toString();
			});

			pythonProcess.on('close', async code => {
				if (code !== 0) {
					await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
						status: 'Denegado',
						ai_decision_explanation:
							'Error en el procesamiento del documento por IA',
					});
					return res
						.status(500)
						.json({ error: 'Error al procesar el documento con IA' });
				}

				try {
					const result = JSON.parse(pythonOutput);

					if (result.status === 'Denegado') {
						await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
							status: 'Denegado',
							ai_decision_explanation: result.ai_decision_explanation,
							validation_errors: result.validation_errors,
						});

						return res.status(400).json({
							error: 'Documento denegado',
							details: result.validation_errors,
						});
					}

					const updatedRecord = await ServiceDeliveryRecord.findByIdAndUpdate(
						newRecord._id,
						{
							...result.extracted_data,
							status: 'Aceptado',
							ai_decision_explanation: result.ai_decision_explanation,
						},
						{ new: true },
					);

					res.status(201).json({
						message: 'Registro de servicio procesado correctamente',
						_id: updatedRecord._id,
					});
				} catch (parseError) {
					console.error('Error al procesar la respuesta de la IA:', parseError);
					await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
						status: 'Denegado',
						ai_decision_explanation: 'Error al procesar la respuesta de la IA',
					});
					res
						.status(500)
						.json({ error: 'Error al procesar la respuesta de la IA' });
				}
			});

			pythonProcess.stderr.on('data', async data => {
				console.error('Error en el script de Python:', data.toString());
				await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
					status: 'Denegado',
					ai_decision_explanation: 'Error en el script de procesamiento',
				});
			});
		} catch (error) {
			console.error('Error al cargar el registro de servicio:', error);
			res.status(500).json({ error: 'Error interno del servidor' });
		}
	},
];

exports.getServiceRecordById = [
	authMiddleware,
	async (req, res) => {
		try {
			const record = await ServiceDeliveryRecord.findById(req.params.id);
			if (!record) {
				return res.status(404).json({ error: 'Registro no encontrado' });
			}
			res.status(200).json(record);
		} catch (error) {
			res.status(500).json({ error: 'Error al obtener el registro' });
		}
	},
];

exports.updateServiceRecord = [
	authMiddleware,
	async (req, res) => {
		try {
			const updatedRecord = await ServiceDeliveryRecord.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!updatedRecord) {
				return res.status(404).json({ error: 'Registro no encontrado' });
			}
			res.status(200).json(updatedRecord);
		} catch (error) {
			res.status(500).json({ error: 'Error al actualizar el registro' });
		}
	},
];
