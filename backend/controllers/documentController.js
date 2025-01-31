const Document = require('../models/Document');

exports.addDocument = async (req, res) => {
	try {
		const { number, type, register_date } =
			req.body;

		const newDocument = new Document({
			number,
			type,
			register_date: new Date(register_date),
		});

		const savedDocument = await newDocument.save();
		res.status(201).json(savedDocument);
	} catch (error) {
		res.status(500).json({
			error: 'Error al crear el documento',
			details: error.message,
		});
	}
};

exports.addDocuments = async (req, res) => {
    try {
        const documents = req.body;

        if (!Array.isArray(documents)) {
            return res.status(400).json({ error: 'Los datos deben ser un arreglo de documentos' });
        }

        for (const doc of documents) {
            if (!doc.number || !doc.register_date || !doc.type) {
                return res.status(400).json({ 
                    error: 'Todos los documentos deben tener number, register_date y type' 
                });
            }
        }

        const savedDocuments = await Document.insertMany(documents);
        res.status(201).json({
            message: 'Documentos creados exitosamente',
            documents: savedDocuments,
        });
    } catch (error) {
        res.status(500).json({
            error: 'Error al crear los documentos',
            details: error.message,
        });
    }
};


exports.getDocumentById = async (req, res) => {
	try {
		const document = await Document.findById(req.params.id).populate(
			'service_delivery_record_id',
		);

		if (!document) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}

		res.status(200).json(document);
	} catch (error) {
		res.status(500).json({
			error: 'Error al obtener el documento',
			details: error.message,
		});
	}
};

exports.updateDocument = async (req, res) => {
	try {
		const { number, type, register_date, service_delivery_record_id } =
			req.body;

		const updatedDocument = await Document.findByIdAndUpdate(
			req.params.id,
			{
				number,
				type,
				register_date: new Date(register_date),
				service_delivery_record_id,
			},
			{ new: true },
		);

		if (!updatedDocument) {
			return res.status(404).json({ error: 'Documento no encontrado' });
		}

		res.status(200).json(updatedDocument);
	} catch (error) {
		res.status(500).json({
			error: 'Error al actualizar el documento',
			details: error.message,
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
			details: error.message,
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
			details: error.message,
		});
	}
};
