const Document = require('../models/Document');

exports.addDocument = async (req, res) => {
	try {
		const { number, type, register_date, service_delivery_record_id } = req.body;

		const newDocument = new Document({
			number,
			type,
			register_date: new Date(register_date),
			service_delivery_record_id
		});

		const savedDocument = await newDocument.save();
		res.status(201).json(savedDocument);
	} catch (error) {
		res.status(500).json({ 
			error: 'Error al crear el documento',
			details: error.message 
		});
	}
};

exports.getDocumentById = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id)
			.populate('service_delivery_record_id');
		
		if (!document) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}
		
		res.status(200).json(document);
	} catch (error) {
		res.status(500).json({ 
			error: 'Error al obtener el documento',
			details: error.message 
		});
	}
};

exports.updateDocument = async (req, res) => {
	try {
		const { number, type, register_date, service_delivery_record_id } = req.body;
		
		const updatedDocument = await Document.findByIdAndUpdate(
			req.params.id,
			{
				number,
				type,
				register_date: new Date(register_date),
				service_delivery_record_id
			},
			{ new: true }
		);

		if (!updatedDocument) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}

		res.status(200).json(updatedDocument);
	} catch (error) {
		res.status(500).json({ 
			error: 'Error al actualizar el documento',
			details: error.message 
		});
	}
};

exports.deleteDocument = async (req, res) => {
	try {
		const deletedDocument = await Document.findByIdAndDelete(req.params.id);
		
		if (!deletedDocument) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}

		res.status(200).json({ message: 'Documento eliminado correctamente' });
	} catch (error) {
		res.status(500).json({ 
			error: 'Error al eliminar el documento',
			details: error.message 
		});
	}
};

exports.getAllDocuments = async (req, res) => {
	try {
		const documents = await Document.find()
			.populate('service_delivery_record_id')
			.sort({ register_date: -1 });

		res.status(200).json(documents);
	} catch (error) {
		res.status(500).json({ 
			error: 'Error al obtener los documentos',
			details: error.message 
		});
	}
};

