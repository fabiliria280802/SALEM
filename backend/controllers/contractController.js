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
			const pythonProcess = spawn('python3', [
				'controllers/IA/ia.py', // Ajusta a 'python3' si es necesario
				filePath,
				documentType
				/*
				req.body.ruc,
    			req.body.contract */

			], {
				env: {
					...process.env, // Mantén las variables de entorno actuales
					TESSDATA_PREFIX: '/usr/share/tesseract/tessdata', // Asegúrate de configurar esto
				},
			});
			

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

						const requiredFields = [
							'contract_number',
							'provider_info_intro',
							'provider_name',
							'provider_ruc',
							'provider_transaction',
							'provider_address',
							'provider_city',
							'provider_country',
							'provider_phone',
							'provider_website',
							'provider_email',
							'client_info_intro',
							'client_name',
							'client_ruc',
							'client_direction',
							'client_city',
							'client_country',
							'service_description_intro',
							'service_table',
							'payment_terms_intro',
							'subtotal',
							'tax_rate',
							'tax_amount',
							'total_due',
							'contract_details_intro',
							'contract_order_number',
							'contract_invoice_number',
							'contract_hes',
							'contract_end_date',
							'signature_intro',
							'signatures.first_person_name',
							'signatures.first_person_position',
							'signatures.first_person_signature',
							'signatures.second_person_name',
							'signatures.second_person_position',
							'signatures.second_person_signature',
							'contract_start_date'
						];
						const missingFields = requiredFields.filter(
							field => !(result.extracted_data && result.extracted_data[field])
						);

						requiredFields.forEach(field => {
							if (!result.extracted_data[field]) {
								result.extracted_data[field] = null; // Marca como nulo para claridad
							}
						});
						

						const status = missingFields.length > 0 ? 'Denegado' : 'Aceptado';
						const validation_errors =
							missingFields.length > 0
								? missingFields.map(
										field => `Campo requerido no encontrado: ${field}`,
									)
								: [];

						console.log("Validation Errors before DB update:", validation_errors);
	
						const updateData = {
							...result.extracted_data,
							status,
							validation_errors,
							ai_decision_explanation:
								missingFields.length > 0
									? 'Faltan campos requeridos'
									: 'Documento procesado correctamente',
						};

						const updatedContract = await Contract.findByIdAndUpdate(
							newContract._id,
							updateData,
							{ new: true },
						);

						res.status(201).json({
							message:
								status === 'Aceptado'
									? 'Contrato procesado correctamente'
									: 'Contrato procesado con errores',
							_id: updatedContract._id,
							status,
							validation_errors,
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
