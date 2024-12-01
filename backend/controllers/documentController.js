const Document = require('../models/Document');
const Invoice = require('../models/Invoice');
const HES = require('../models/Hes');
const MIGO = require('../models/Migo');
const { spawn } = require('child_process');
const path = require('path');

exports.addADocument = async (req, res) => {
	try {
		const { ruc, contract, documentType } = req.body;
		const file = req.file;

		if (!file) {
			return res
				.status(400)
				.json({ error: 'No se ha proporcionado un archivo' });
		}

		const newDocument = new Document({
			ruc,
			contrato: contract,
			tipoDocumento: documentType,
			file_path: path.join('data', file.filename),
			status: 'Analizando',
		});

		await newDocument.save();

		const filePath = newDocument.file_path;
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
				await Document.findByIdAndUpdate(newDocument._id, {
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
				let savedDocument;

				switch (documentType) {
					case 'Invoice':
						savedDocument = await processInvoice(result, newDocument, req.user);
						break;
					case 'HES':
						savedDocument = await processHES(result, newDocument, req.user);
						break;
					case 'MIGO':
						savedDocument = await processMIGO(result, newDocument, req.user);
						break;
					default:
						throw new Error('Tipo de documento no soportado');
				}

				if (result.status === 'Denegado') {
					await Document.findByIdAndUpdate(newDocument._id, {
						status: 'Denegado',
						ai_decision_explanation: result.ai_decision_explanation,
						human_review_needed: true,
						validation_errors: result.validation_errors,
					});

					return res.status(400).json({
						error: 'Documento denegado',
						details: result.validation_errors,
					});
				}

				await Document.findByIdAndUpdate(newDocument._id, {
					related_id: savedDocument._id,
					status: 'Aceptado',
					ai_decision_explanation: result.ai_decision_explanation,
				});

				res.status(201).json({
					message: 'Documento cargado y procesado correctamente',
					document_id: newDocument._id,
				});
			} catch (parseError) {
				console.error('Error al procesar la respuesta de la IA:', parseError);
				await Document.findByIdAndUpdate(newDocument._id, {
					status: 'Denegado',
					ai_decision_explanation: 'Error al procesar la respuesta de la IA',
					human_review_needed: true,
				});
				res
					.status(500)
					.json({ error: 'Error al procesar la respuesta de la IA' });
			}
		});

		pythonProcess.stderr.on('data', async data => {
			console.error('Error en el script de Python:', data.toString());
			await Document.findByIdAndUpdate(newDocument._id, {
				status: 'Denegado',
				ai_decision_explanation: 'Error en el script de procesamiento',
				human_review_needed: true,
			});
		});
	} catch (error) {
		console.error('Error al cargar el documento:', error);
		res
			.status(500)
			.json({ error: 'Error interno del servidor al cargar el documento' });
	}
};

exports.addingTrainingDocuments = async (req, res) => {
	// ... código de la función ...
};

exports.getDocumentById = async (req, res) => {
	// ... código de la función ...
};

exports.updateDocument = async (req, res) => {
	// ... código de la función ...
};

exports.getDocumentsList = async (req, res) => {
	try {
		const documents = await Document.find()
			.populate('related_id')
			.sort({ created_at: -1 }); // Ordenar por fecha de creación, más recientes primero

		// Formatear la respuesta para incluir toda la información necesaria
		const formattedDocuments = documents.map(doc => ({
			_id: doc._id,
			ruc: doc.ruc,
			contrato: doc.contrato,
			tipoDocumento: doc.tipoDocumento,
			created_at: doc.created_at,
			status: doc.status,
			ai_decision_explanation: doc.ai_decision_explanation,
			human_review_needed: doc.human_review_needed,
			validation_errors: doc.validation_errors,
			// Incluir información relacionada si existe
			related_document: doc.related_id
				? {
						...doc.related_id.toObject(),
					}
				: null,
		}));

		res.status(200).json(formattedDocuments);
	} catch (error) {
		console.error('Error al obtener la lista de documentos:', error);
		res.status(500).json({
			error: 'Error al obtener la lista de documentos',
			details: error.message,
		});
	}
};

async function processInvoice(result, document, user) {
	const { extracted_data } = result;

	const userByRuc = await User.findOne({ ruc: document.ruc });
	if (!userByRuc) {
		console.warn(`No se encontró usuario con RUC: ${document.ruc}`);
	}

	const invoiceData = {
		document_id: document._id,
		user_id: userByRuc ? userByRuc._id : null,
	};

	// Solo agregar los campos que existen en extracted_data
	if (extracted_data.invoice_number)
		invoiceData.invoice_number = extracted_data.invoice_number;
	if (extracted_data.provider_ruc)
		invoiceData.provider_ruc = extracted_data.provider_ruc;
	if (extracted_data.provider_name)
		invoiceData.provider_name = extracted_data.provider_name;
	if (extracted_data.issue_date)
		invoiceData.issue_date = new Date(extracted_data.issue_date);
	if (extracted_data.total)
		invoiceData.total = parseFloat(extracted_data.total);
	if (extracted_data.subtotal)
		invoiceData.subtotal = parseFloat(extracted_data.subtotal);
	if (extracted_data.iva) invoiceData.iva = parseFloat(extracted_data.iva);

	const invoice = new Invoice(invoiceData);
	return await invoice.save();
}

