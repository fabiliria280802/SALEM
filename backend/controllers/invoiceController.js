/*
    Description: Migo logic
    By: Fabiana Liria
    version: 1.0
*/
const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');

exports.createInvoice = async (req, res) => {
	try {
		const {
			user_id,
			invoice_number,
			provider_ruc,
			provider_name,
			provider_address,
			issue_date,
			details,
			total,
			invoice_documents,
		} = req.body;

		const calculatedTotal = details.reduce(
			(acc, item) => acc + item.quantity * item.unit_price,
			0,
		);
		if (calculatedTotal !== total) {
			return res.status(400).json({
				error: 'El total calculado no coincide con el total proporcionado',
			});
		}

		const invoice = new Invoice({
			user_id,
			invoice_number,
			provider_ruc,
			provider_name,
			provider_address,
			issue_date,
			details,
			total,
			invoice_documents,
		});

		const savedInvoice = await invoice.save();
		res.status(201).json(savedInvoice);
	} catch (error) {
		console.error('Error al crear la factura:', error);
		res.status(500).json({ error: 'Error al crear la factura' });
	}
};

exports.getAllInvoices = async (req, res) => {
	try {
		const invoices = await Invoice.find().populate('user_id', 'name email');
		res.status(200).json(invoices);
	} catch (error) {
		console.error('Error al obtener las facturas:', error);
		res.status(500).json({ error: 'Error al obtener las facturas' });
	}
};

exports.getInvoiceById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de factura inválido' });
		}

		const invoice = await Invoice.findById(id).populate(
			'user_id',
			'name email',
		);
		if (!invoice) {
			return res.status(404).json({ error: 'Factura no encontrada' });
		}

		res.status(200).json(invoice);
	} catch (error) {
		console.error('Error al obtener la factura:', error);
		res.status(500).json({ error: 'Error al obtener la factura' });
	}
};

exports.updateInvoice = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			provider_ruc,
			provider_name,
			provider_address,
			issue_date,
			details,
			total,
			invoice_documents,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de factura inválido' });
		}

		const calculatedTotal = details.reduce(
			(acc, item) => acc + item.quantity * item.unit_price,
			0,
		);
		if (calculatedTotal !== total) {
			return res.status(400).json({
				error: 'El total calculado no coincide con el total proporcionado',
			});
		}

		const updatedInvoice = await Invoice.findByIdAndUpdate(
			id,
			{
				provider_ruc,
				provider_name,
				provider_address,
				issue_date,
				details,
				total,
				invoice_documents,
			},
			{ new: true },
		);

		if (!updatedInvoice) {
			return res.status(404).json({ error: 'Factura no encontrada' });
		}

		res.status(200).json(updatedInvoice);
	} catch (error) {
		console.error('Error al actualizar la factura:', error);
		res.status(500).json({ error: 'Error al actualizar la factura' });
	}
};

exports.deleteInvoice = async (req, res) => {
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
};

exports.getInvoiceByNumber = async (req, res) => {
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
};
