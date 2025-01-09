/*
    Description: Invoice logic for
    By: Fabiana Liria
    version: 1.0
*/
const Invoice = require('../models/Invoice');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
exports.createInvoice = [
	authMiddleware,
	async (req, res, next) => {
		const { ruc, invoice, documentType } = req.body;
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

			const newInvoice = new Invoice({
				invoice_number: invoice,
				file_path: path.join('data', 'docs', file.filename),
				status: 'Analizando',
				created_by: req.user.id,
			});

			await newInvoice.save();

			const filePath = path.join(process.cwd(), newInvoice.file_path);
			const pythonProcess = spawn('python3', [
				'controllers/IA/ia.py',
				filePath,
				documentType,
				req.body.ruc,
    			req.body.invoice

			], {
				env: {
					...process.env,
					TESSDATA_PREFIX: '/usr/share/tesseract/tessdata', 
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

						const requiredFields = [];
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

						const updateInvoice = await invoice.findByIdAndUpdate(
							newContract._id,
							updateData,
							{ new: true },
						);

						res.status(201).json({
							message:
								status === 'Aceptado'
									? 'Factura procesado correctamente'
									: 'Factura procesado con errores',
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

/*
exports.createInvoice = [
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

			const newInvoice = new Invoice({
				document_id: null,
				file_path: path.join('data', file.filename),
				status: 'Analizando',
				created_by: req.user.id,
			});

			await newInvoice.save();

			const filePath = newInvoice.file_path;
			const pythonProcess = spawn('python', [
				'controllers/IA/ia.py',
				filePath,
				documentType,
				ruc,
				contract,
			]);

			let pythonOutput = '';

			pythonProcess.stdout.on('data', data => {
				pythonOutput += data.toString();
			});

			pythonProcess.on('close', async code => {
				if (code !== 0) {
					await Invoice.findByIdAndUpdate(newInvoice._id, {
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
					const validation_errors = [];
					const extracted_data = result.extracted_data;

					// Validar número de factura
					if (!extracted_data.invoice_number?.match(/^invoice-\d{6}$/)) {
						validation_errors.push({
							field: 'invoice_number',
							value: extracted_data.invoice_number,
							error: 'Formato inválido. Debe ser invoice-XXXXXX',
						});
					}

					// Validar fechas
					const issue_date = new Date(extracted_data.issue_date);
					if (isNaN(issue_date)) {
						validation_errors.push({
							field: 'issue_date',
							value: extracted_data.issue_date,
							error: 'Fecha de emisión inválida',
						});
					}

					// Validar cálculos financieros
					const subtotal = parseFloat(extracted_data.subtotal || 0);
					const discount_percentage = parseInt(
						extracted_data.discount_percentage || 0,
					);
					const discount = (subtotal * discount_percentage) / 100;
					const subtotal_with_discount = subtotal - discount;
					const iva = subtotal_with_discount * 0.15;
					const calculated_total = subtotal_with_discount + iva;
					const extracted_total = parseFloat(extracted_data.total || 0);

					if (Math.abs(calculated_total - extracted_total) > 0.01) {
						validation_errors.push({
							field: 'total',
							value: extracted_total,
							error: `Total calculado (${calculated_total}) no coincide con el total extraído (${extracted_total})`,
						});
					}

					// Validar campos requeridos
					const requiredFields = [
						'issuing_company',
						'receiving_company',
						'service',
					];
					requiredFields.forEach(field => {
						if (!extracted_data[field]) {
							validation_errors.push({
								field,
								value: null,
								error: 'Campo requerido no encontrado',
							});
						}
					});

					// Actualizar factura con datos extraídos y validaciones
					const updateData = {
						...extracted_data,
						discount,
						subtotal_with_discount,
						iva,
						total: calculated_total,
						status: validation_errors.length > 0 ? 'Denegado' : 'Aceptado',
						validation_errors: validation_errors.map(
							err =>
								`${err.field}: ${err.value || 'no encontrado'} - ${err.error}`,
						),
						ai_decision_explanation:
							validation_errors.length > 0
								? 'Se encontraron errores en la validación'
								: 'Documento procesado correctamente',
					};

					const updatedInvoice = await Invoice.findByIdAndUpdate(
						newInvoice._id,
						updateData,
						{ new: true },
					);

					res.status(201).json({
						message:
							validation_errors.length > 0
								? 'Factura procesada con errores'
								: 'Factura procesada correctamente',
						_id: updatedInvoice._id,
						validation_errors,
					});
				} catch (parseError) {
					console.error('Error al procesar la respuesta de la IA:', parseError);
					await Invoice.findByIdAndUpdate(newInvoice._id, {
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
				await Invoice.findByIdAndUpdate(newInvoice._id, {
					status: 'Denegado',
					ai_decision_explanation: 'Error en el script de procesamiento',
				});
			});
		} catch (error) {
			console.error('Error al cargar la factura:', error);
			res.status(500).json({ error: 'Error interno del servidor' });
		}
	},
];
*/
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
