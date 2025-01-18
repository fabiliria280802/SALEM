/*
    Description: ServiceDeliveryRecord Controller for create, get, update and delete services.
    By: Fabiana Liria
    version: 1.0
*/
const ServiceDeliveryRecord = require('../models/ServiceDeliveryRecord');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const Document = require('../models/Document');
const Contract = require('../models/Contract');

exports.createServiceRecord = [
    authMiddleware,
    async (req, res, next) => {
        try {
            const { ruc, hes, documentType, contractId } = req.body;
            const file = req.file;
			
            if (!file) {
                return res.status(400).json({ error: 'No se ha proporcionado un archivo' });
            }

            if (!contractId) {
                return res.status(400).json({ error: 'El contract_id es obligatorio' });
            }

            const hesRecord = await Document.findOne({ number: hes });
            if (!hesRecord) {
                return res.status(404).json({ error: `HES con número ${hes} no encontrado` });
            }

            const contractNumber = await Contract.findById(contractId);
            if (!contractNumber) {
                return res.status(404).json({ error: `HES con número ${contractId} no encontrado` });
            }
            let newRecord;
            try {

                newRecord = new ServiceDeliveryRecord({
                    ruc: ruc,
                    hes_id: hesRecord._id,
                    hes_number: hes,
                    contract_id: contractId,
                    file_path: path.join('data', 'docs', file.filename),
                    status: 'Analizando',
                    created_by: req.user.id,
                });

                await newRecord.save();
                console.log("guardado en DB", newRecord);
            } catch (error) {
                console.error("Error al guardar en la base de datos:", error);
            }            

            const filePath = path.join(process.cwd(), newRecord.file_path);
            const pythonProcess = spawn(
                'python3',
                [
                    'controllers/IA/ia.py',
                    filePath,
                    documentType,
                    ruc,
                    hesRecord._id,
                    contractNumber.contract_number,
                ],
                {
                    env: {
                        ...process.env,
                        TESSDATA_PREFIX: process.env.TESSDATA_PREFIX,
                    },
                },
            );

            let pythonOutput = '';
            let pythonError = '';

            pythonProcess.stdout.on('data', data => {
                console.log('Error de Python:', data.toString());
                pythonOutput += data.toString();
            });

            pythonProcess.stderr.on('data', data => {
                console.error('Error de Python:', data.toString());
                pythonError += data.toString();
            });

            pythonProcess.on('close', async code => {
                if (code !== 0) {
                    console.log("this is the code",code)
                    await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
                        status: 'Denegado',
                        ai_decision_explanation: `Error en el procesamiento: ${pythonError}`,
                    });
                    console.log("hay un error en line close pythonProcess")
                    return res.status(500).json({
                        error: 'Error al procesar el documento con IA',
                        details: pythonError,
                    });
                }

                try {
                    console.log("esperando valid")
                    console.log("retorn:",pythonOutput)
                    const result = JSON.parse(pythonOutput);

                    const status = result.validation_errors?.length > 0 ? 'Denegado' : 'Aceptado';
                    const updateData = {
                        ...result.extracted_data,
                        status,
                        ai_decision_explanation: result.ai_decision_explanation,
                    };

                    await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, updateData, {
                        new: true,
                    });

                    res.status(201).json({
                        message: status === 'Aceptado'
                            ? 'Registro procesado correctamente'
                            : 'Registro procesado con errores',
                        _id: newRecord._id,
                        ...updateData,
                    });
                } catch (parseError) {
                    await ServiceDeliveryRecord.findByIdAndUpdate(newRecord._id, {
                        status: 'Denegado',
                        ai_decision_explanation: 'Error al procesar la respuesta de la IA',
                    });
				/*
                    res.status(500).json({
                        error: 'Error al procesar la respuesta de la IA',
                        details: parseError.message,
                    });*/
                }
            });
        } catch (error) {
            res.status(500).json({ error: 'Error interno del servidor', details: error.message });
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
