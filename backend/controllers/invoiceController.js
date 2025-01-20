/*
    Description: Invoice logic for
    By: Fabiana Liria
    version: 1.0
*/
const Invoice = require('../models/Invoice');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const Contract = require('../models/Contract');
const ServiceDeliveryRecord = require('../models/ServiceDeliveryRecord');

exports.createInvoice = [
	authMiddleware,
	async (req, res, next) => {
		const { ruc, contract, documentType } = req.body;
		try {
			const file = req.file;

			if (documentType !== 'Invoice') {
				return res.status(400).json({
					error: 'Tipo de documento inválido',
					details: `Se esperaba 'Invoice', se recibió '${documentType}'`,
				});
			}

			if (!file) {
				return res
					.status(400)
					.json({ error: 'No se ha proporcionado un archivo' });
			}
			const contractId = await Contract.findOne({ contract_number: contract });
			if (!contractId) {
                return res.status(404).json({ error: `Contrato con número ${contract} no encontrado` });
            }
			let newInvoice;
			try {
				newInvoice = new Invoice({
					contract_id: contractId,
					contract_number: contract,
					file_path: path.join('data', 'docs', file.filename),
					status: 'Analizando',
					created_by: req.user.id,
				});
				await newInvoice.save();
			}catch (error) {
				console.error('Error al guardar la factura:', error);
			}

			const filePath = path.join(process.cwd(), newInvoice.file_path);
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
                console.log('Salida de Python (stdout):', data.toString());
                pythonOutput += data.toString();
            });
            
            pythonProcess.stderr.on('data', data => {
                console.error('Salida de Python (stderr):', data.toString());
                pythonError += data.toString();
            }); 

			pythonProcess.on('close', async code => {
				if (code !== 0) {
					console.error('Python script error:', pythonError);
					await Invoice.findByIdAndUpdate(newInvoice._id, {
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
                                } else if (result.extracted_data[key] == null) {
                                    result.extracted_data[key] = 'N/A';
                                }
                            });
                        }
            
						const status =
						(result.validation_errors && result.validation_errors.length > 0) ||
						(result.missing_fields && result.missing_fields.length > 0)
							? 'Denegado'
							: 'Aceptado';
					
						const ai_decision_explanation =
							status === 'Denegado'
								? `Documento denegado. ${
									  result.missing_fields && result.missing_fields.length > 0
										  ? `Campos faltantes: ${result.missing_fields.join(', ')}. `
										  : ''
								  }${
									  result.validation_errors && result.validation_errors.length > 0
										  ? `Errores de validación: ${result.validation_errors.join(', 	')}.`
										  : ''
								  }`
								: 'Documento procesado correctamente';
							  
						const updateData = {
							...result.extracted_data,
							_id: newInvoice._id,
							status,
							invoice_number: result.extracted_data.invoice_number || 'No encontrado',
							issue_date: result.extracted_data.issue_date || null,
							issuing_company: result.extracted_data.issuing_company || 'No encontrado',
							receiving_company: result.extracted_data.receiving_company || 'No encontrado',
							ai_decision_explanation,
							missing_fields: result.missing_fields || [],
							validation_errors: result.validation_errors || [],
						};
						console.log('Datos actualizados:', updateData);
						await Invoice.findByIdAndUpdate(newInvoice._id, updateData, { 
							new: true 
						});

						res.status(201).json({
							message:
								status === 'Aceptado'
									? 'Factura procesado correctamente'
									: 'Factura procesado con errores',
							_id: newInvoice._id,
							status,
							...updateData,
						});
					} catch (parseError) {
						console.error('Error al parsear JSON:', parseError);
						console.error('JSON intentado parsear:', jsonStr);
						throw new Error(`Error al parsear JSON: ${parseError.message}`);
					}
				} catch (error) {
					console.error('Error completo al procesar la respuesta:', error);
					console.error('Salida completa de Python:', pythonOutput);

					await Contract.findByIdAndUpdate(newInvoice._id, {
						status: 'Denegado',
						ai_decision_explanation:
							'Error al procesar la respuesta: formato inválido',
					});

                    return res.status(500).json({
                        error: 'Error al procesar la respuesta de la IA',
                        details: error.message,
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

exports.getAllInvoices = [
	authMiddleware,
	async (req, res) => {
		try {
			const invoices = await Invoice.find().populate('user_id', 'name email');
			res.status(200).json(invoices);
		} catch (error) {
			console.error('Error al obtener las facturas:', error);
			res.status(500).json({ error: 'Error al obtener las facturas' });
		}
	},
];

exports.getInvoiceById = [
	authMiddleware,
	async (req, res) => {
		try {
			const invoice = await Invoice.findById(req.params.id);
			if (!invoice) {
				return res.status(404).json({ error: 'Factura no encontrada' });
			}
			res.status(200).json(invoice);
		} catch (error) {
			res.status(500).json({ error: 'Error al obtener la factura' });
		}
	},
];

exports.updateInvoice = [
	authMiddleware,
	async (req, res) => {
		try {
			const updatedInvoice = await Invoice.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!updatedInvoice) {
				return res.status(404).json({ error: 'Factura no encontrada' });
			}
			res.status(200).json(updatedInvoice);
		} catch (error) {
			res.status(500).json({ error: 'Error al actualizar la factura' });
		}
	},
];

exports.deleteInvoice = [
	authMiddleware,
	async (req, res) => {
		try {
			const { id } = req.params;

			if (!mongoose.Types.ObjectId.isValid(id)) {
				return res.status(400).json({ error: 'ID de factura inválido' });
			}

			const deletedInvoice = await Invoice.findByIdAndDelete(id);
			if (!deletedInvoice) {
				return res.status(404).json({ error: 'Factura no encontrada' });
			}

			res.status(200).json({ message: 'Factura eliminada correctamente' });
		} catch (error) {
			console.error('Error al eliminar la factura:', error);
			res.status(500).json({ error: 'Error al eliminar la factura' });
		}
	},
];

exports.getInvoiceByNumber = [
	authMiddleware,
	async (req, res) => {
		try {
			const { invoice_number } = req.params;

			const invoice = await Invoice.findOne({ invoice_number }).populate(
				'user_id',
				'name email',
			);
			if (!invoice) {
				return res.status(404).json({ error: 'Factura no encontrada' });
			}

			res.status(200).json(invoice);
		} catch (error) {
			console.error('Error al obtener la factura por número:', error);
			res.status(500).json({ error: 'Error al obtener la factura por número' });
		}
	},
];
