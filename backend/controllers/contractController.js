/*
    Description: Contract Controller for create, get, update and delete contracts.
    By: Fabiana Liria
    version: 1.0
*/
const Contract = require('../models/Contract');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

exports.createContract = [
	authMiddleware,
	async (req, res, next) => {
		const { ruc, contract, documentType } = req.body;
		try {
			const file = req.file;

			if (documentType !== 'Contract') {
				return res.status(400).json({
					error: 'Tipo de documento inválido',
					details: `Se esperaba 'Contract', se recibió '${documentType}'`,
				});
			}

			if (!file) {
				return res
					.status(400)
					.json({ error: 'No se ha proporcionado un archivo' });
			}

			const newContract = new Contract({
				contract_number: contract,
				file_path: path.join('data', 'docs', file.filename),
				status: 'Analizando',
				created_by: req.user.id,
			});

			await newContract.save();

			const filePath = path.join(process.cwd(), newContract.file_path);
			const pythonProcess = spawn(
				'python3',
				[
					'controllers/IA/ia.py',
					filePath,
					documentType,
					req.body.ruc,
					req.body.contract,
				],
				{
					env: {
						...process.env,
						TESSDATA_PREFIX: '/usr/share/tesseract/tessdata',
					},
				},
			);

			let pythonOutput = '';
			let pythonError = '';

			pythonProcess.stdout.on('data', data => {
				pythonOutput += data.toString();
			});

			pythonProcess.stderr.on('data', data => {
				console.error('Error de Python:', data.toString());
				pythonError += data.toString(); // Acumula los errores aquí
			});

			pythonProcess.on('close', async code => {
				if (code !== 0) {
					console.error('Python script error:', pythonError);
					await Contract.findByIdAndUpdate(newContract._id, {
						status: 'Denegado',
						ai_decision_explanation: `Error en el procesamiento: ${pythonError}`,
					});
					return res.status(500).json({
						error: 'Error al procesar el documento con IA',
						details: pythonError,
					});
				}

				try {
					let jsonStr = pythonOutput;
					try {
						const matches = pythonOutput.match(/({[\s\S]*?})\s*$/);
						if (matches) {
							jsonStr = matches[1];
						}

						jsonStr = jsonStr
							.replace(/\n/g, ' ')
							.replace(/\r/g, '')
							.replace(/\s+/g, ' ')
							.replace(/\\\\/g, '\\')
							.replace(/\\"/g, '"')
							.replace(/"\s*:\s*"([^"]*?)\\*"/g, '": "$1"')
							.trim();

						console.log('JSON limpio:', jsonStr);
						const result = JSON.parse(jsonStr);

						if (result.extracted_data) {
							Object.keys(result.extracted_data).forEach(key => {
								if (typeof result.extracted_data[key] === 'string') {
									result.extracted_data[key] = result.extracted_data[key]
										.replace(/\\+/g, '')
										.replace(/"{2,}/g, '"')
										.replace(/^"|"$/g, '')
										.replace(/\\n/g, ' ')
										.trim();
								}
							});
						}

						const status =
							result.validation_errors && result.validation_errors.length > 0
								? 'Denegado'
								: 'Aceptado';
						const ai_decision_explanation =
							status === 'Denegado'
								? `Documento denegado. Errores: ${result.validation_errors.join(', ')}`
								: 'Documento procesado correctamente';

						console.log(
							'Validation Errors before DB update:',
							result.validation_errors,
						);

						const updateData = {
							...result.extracted_data,
							_id: newContract._id,
							status,
							provider_ruc: result.extracted_data?.provider_ruc, 
    						contract_number: result.extracted_data?.contract_number,
							contracted_company: result.extracted_data?.provider_name,
							contract_type: documentType,
							missing_fields: result.missing_fields || [],
							validation_errors: result.validation_errors || [],
							ai_decision_explanation,
						};

						await Contract.findByIdAndUpdate(newContract._id, updateData, {
							new: true,
						});

						res.status(201).json({
							message:
								status === 'Aceptado'
									? 'Contrato procesado correctamente'
									: 'Contrato procesado con errores',
							_id: newContract._id,
							status,
							provider_ruc: result.extracted_data?.provider_ruc, 
    						contract_number: result.extracted_data?.contract_number,
							contracted_company: result.extracted_data?.provider_name,
							contract_type: documentType,
							missing_fields: result.missing_fields || [],
							validation_errors: result.validation_errors || [],
						});
					} catch (parseError) {
						console.error('Error al parsear JSON:', parseError);
						console.error('JSON intentado parsear:', jsonStr);
						throw new Error(`Error al parsear JSON: ${parseError.message}`);
					}
				} catch (error) {
					console.error('Error completo al procesar la respuesta:', error);
					console.error('Salida completa de Python:', pythonOutput);

					await Contract.findByIdAndUpdate(newContract._id, {
						status: 'Denegado',
						ai_decision_explanation:
							'Error al procesar la respuesta: formato inválido',
					});

					/*
					res.status(500).json({
						error: 'Error al procesar la respuesta de la IA',
						details: pythonError,
					});
					*/
				}
			});
		} catch (error) {
			console.error('Error completo:', error);
			res.status(500).json({
				error: 'Error interno del servidor',
				details: error.message,
			});
		}
	},
];

exports.getContractById = [
	authMiddleware,
	async (req, res, next) => {
		try {
			const contract = await Contract.findById(req.params.id);
			if (!contract) {
				return res.status(404).json({ error: 'Contrato no encontrado' });
			}
			res.status(200).json(contract);
		} catch (error) {
			res.status(500).json({ error: 'Error al obtener el contrato' });
		}
	},
];

exports.updateContract = [
	authMiddleware,
	async (req, res) => {
		try {
			const updatedContract = await Contract.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!updatedContract) {
				return res.status(404).json({ error: 'Contrato no encontrado' });
			}
			res.status(200).json(updatedContract);
		} catch (error) {
			res.status(500).json({ error: 'Error al actualizar el contrato' });
		}
	},
];

exports.deleteContract = [
	authMiddleware,
	async (req, res) => {
		try {
			const deletedContract = await Contract.findByIdAndDelete(req.params.id);
			if (!deletedContract) {
				return res.status(404).json({ message: 'Contrato no encontrado' });
			}
			res.status(200).json({ message: 'Contrato eliminado exitosamente' });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];
