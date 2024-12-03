/*
    Description: Invoice logic for
    By: Fabiana Liria
    version: 1.0
*/
const Invoice = require('../models/Invoice');
const mongoose = require('mongoose');

exports.createInvoice = async (req, res) => {
	try {
		const {
			factura_number,
			fecha_emision,
			empresa_emisora,
			empresa_receptora,
			servicio,
			subtotal,
			descuento_porcentaje
		} = req.body;

		const newInvoice = new Invoice({
			factura_number,
			fecha_emision,
			empresa_emisora,
			empresa_receptora,
			servicio,
			subtotal,
			descuento_porcentaje,
			created_by: req.user.id
		});

		const savedInvoice = await newInvoice.save();
		res.status(201).json(savedInvoice);
	} catch (error) {
		res.status(500).json({ message: error.message });
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
