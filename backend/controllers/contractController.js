/*
    Description: Contract Controller for create, get, update and delete contracts.
    By: Fabiana Liria
    version: 2.3.1
*/
const Contract = require('../models/Contract');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const DocsMetrics = require('../models/DocsMetrics');

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
						TESSDATA_PREFIX: process.env.TESSDATA_PREFIX,
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

						const docsMetrics = new DocsMetrics({
							documentID: newContract._id,
							documentType: 'Contract',
							ai_accuracy: result.ai_accuracy || 0,
							ai_confidence_score: result.ai_confidence_score || 0,
							execution_time: result.execution_time || 0,
						});
	
						await docsMetrics.save();

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

exports.getAllContracts = [
	authMiddleware,
	async (req, res) => {
		try {
			const contracts = await Contract.find();
			res.status(200).json(contracts);
		} catch (error) {
			res.status(500).json({ message: 'Error al obtener contratos', error });
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
        const { ai_decision_explanation, status, documentType, ruc, contract} = req.body;

        let filePath = req.body.filePath;
		
        try {
            // Verificar el tipo de documento si está presente
            if (documentType && documentType !== 'Contract') {
                return res.status(400).json({
                    error: 'Tipo de documento inválido',
                    details: `Se esperaba 'Contract', se recibió '${documentType}'`,
                });
            }

            // Obtener el contrato existente
            const existingContract = await Contract.findById(req.params.id);
            if (!existingContract) {
                console.error('Contrato no encontrado:', req.params.id);
                return res.status(404).json({ error: 'Contrato no encontrado' });
            }

            console.log('Contrato existente encontrado:', existingContract);
            if (req.file) {
                filePath = path.join('data', 'docs', req.file.filename);
                console.log('Nuevo archivo cargado:', filePath);
            }
            // Determinar si se deben revalidar los datos con la IA
            const isIARequired = ruc && contract && documentType === 'Contract';

            if (isIARequired) {
                console.log('Iniciando validación con IA...');

                const pythonProcess = spawn(
                    'python3',
                    [
                        'controllers/IA/ia.py',
                        filePath,
                        documentType,
                        ruc,
                        contract,
                    ],
                    {
                        env: {
                            ...process.env,
                            TESSDATA_PREFIX: process.env.TESSDATA_PREFIX,
                        },
                    }
                );

                let pythonOutput = '';
                let pythonError = '';

				pythonProcess.stdout.on('data', (data) => {
					pythonOutput += data.toString();
				});
				
				pythonProcess.stderr.on('data', (data) => {
					console.error('Error de Python:', data.toString());
					pythonError += data.toString();
				});
				
				pythonProcess.on('close', async (code) => {
					if (code !== 0) {
						console.error('Python script error:', pythonError);
						await Contract.findByIdAndUpdate(existingContract._id, {
							status: 'Denegado',
							ai_decision_explanation: `Error en el procesamiento: ${pythonError}`,
						});
						return res.status(500).json({
							error: 'Error al procesar el documento con IA',
							details: pythonError,
						});
					}
				
					try {
						// Filtra posibles mensajes no JSON
						const jsonMatch = pythonOutput.match(/({[\s\S]*})/); // Captura solo JSON
						if (!jsonMatch) throw new Error('Salida no válida del script de Python');
				
						const result = JSON.parse(jsonMatch[1]);
				
						const newStatus =
							result.validation_errors && result.validation_errors.length > 0
								? 'Denegado'
								: 'Aceptado';
				
						const newExplanation =
							newStatus === 'Denegado'
								? `Documento denegado. Errores: ${result.validation_errors.join(', ')}`
								: 'Documento procesado correctamente';
				
						const updateData = {
							...result.extracted_data,
							status: newStatus,
							provider_ruc: result.extracted_data?.provider_ruc,
							contract_number: result.extracted_data?.contract_number,
							contracted_company: result.extracted_data?.provider_name,
							missing_fields: result.missing_fields || [],
							validation_errors: result.validation_errors || [],
							ai_decision_explanation: newExplanation,
						};
				
						const updatedContract = await Contract.findByIdAndUpdate(
							existingContract._id,
							updateData,
							{ new: true }
						);
				
						return res.status(200).json(updatedContract);
					} catch (error) {
						console.error('Error al procesar la salida de la IA:', error);
						return res.status(500).json({
							error: 'Error al procesar la salida de la IA',
							details: error.message,
						});
					}
				});				
            } else {
                // Actualizar solo el estado
                const updatedContract = await Contract.findByIdAndUpdate(
                    req.params.id,
                    { 
						status,         
						ai_decision_explanation:`${ai_decision_explanation}<br><br><strong>Nota:</strong> Se hizo una validación manual por un Gestor de ENAP.`
					},
                    { new: true }
                );
                return res.status(200).json(updatedContract);
            }
        } catch (error) {
            console.error('Error interno:', error);
            return res.status(500).json({ error: 'Error interno del servidor' });
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
