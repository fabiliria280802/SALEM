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
        user_id: userByRuc ? userByRuc._id : null
    };

	// Solo agregar los campos que existen en extracted_data
	if (extracted_data.invoice_number) invoiceData.invoice_number = extracted_data.invoice_number;
	if (extracted_data.provider_ruc) invoiceData.provider_ruc = extracted_data.provider_ruc;
	if (extracted_data.provider_name) invoiceData.provider_name = extracted_data.provider_name;
	if (extracted_data.issue_date) invoiceData.issue_date = new Date(extracted_data.issue_date);
	if (extracted_data.total) invoiceData.total = parseFloat(extracted_data.total);
	if (extracted_data.subtotal) invoiceData.subtotal = parseFloat(extracted_data.subtotal);
	if (extracted_data.iva) invoiceData.iva = parseFloat(extracted_data.iva);

	const invoice = new Invoice(invoiceData);
	return await invoice.save();
}

async function processHES(result, document, user) {
	const { extracted_data } = result;

	const userByRuc = await User.findOne({ ruc: document.ruc });
    if (!userByRuc) {
        console.warn(`No se encontró usuario con RUC: ${document.ruc}`);
    }

    const hesData = {
        document_id: document._id,
        user_id: userByRuc ? userByRuc._id : null
    };

	// Solo agregar los campos que existen en extracted_data
	if (extracted_data.title) hesData.title = extracted_data.title;
	if (extracted_data.receiving_company) hesData.receiving_company = extracted_data.receiving_company;
	if (extracted_data.order_number) hesData.order_number = extracted_data.order_number;
	if (extracted_data.start_date) hesData.start_date = new Date(extracted_data.start_date);
	if (extracted_data.end_date) hesData.end_date = new Date(extracted_data.end_date);
	if (extracted_data.service_location) hesData.service_location = extracted_data.service_location;
	if (extracted_data.service_description) hesData.service_description = extracted_data.service_description;
	if (extracted_data.observations) hesData.observations = extracted_data.observations;
	if (extracted_data.signatures && Array.isArray(extracted_data.signatures)) {
		hesData.signatures = extracted_data.signatures;
	}

	const hes = new HES(hesData);
	return await hes.save();
}

async function processMIGO(result, document, user) {
	const { extracted_data } = result;

	const userByRuc = await User.findOne({ ruc: document.ruc });
    if (!userByRuc) {
        console.warn(`No se encontró usuario con RUC: ${document.ruc}`);
    }

    const migoData = {
        document_id: document._id,
        user_id: userByRuc ? userByRuc._id : null
    };


	// Solo agregar los campos que existen en extracted_data
	if (extracted_data.title) migoData.title = extracted_data.title;
	if (extracted_data.migo_number) migoData.migo_number = extracted_data.migo_number;
	if (extracted_data.date) migoData.date = new Date(extracted_data.date);
	if (extracted_data.client) migoData.client = extracted_data.client;
	if (extracted_data.address) migoData.address = extracted_data.address;
	if (extracted_data.client_signature) migoData.client_signature = extracted_data.client_signature;
	if (extracted_data.observations) migoData.observations = extracted_data.observations;

	// Procesar item_details solo si existen y son válidos
	if (extracted_data.item_details && Array.isArray(extracted_data.item_details)) {
		migoData.item_details = extracted_data.item_details.map(item => ({
			quantity: item.quantity ? parseFloat(item.quantity) : undefined,
			description: item.description,
			unit_price: item.unit_price ? parseFloat(item.unit_price) : undefined,
			total_price: item.total_price ? parseFloat(item.total_price) : undefined
		}));
	}

	const migo = new MIGO(migoData);
	return await migo.save();
}
