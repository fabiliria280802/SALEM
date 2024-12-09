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
			invoice_number,
			issue_date,
			issuing_company,
			receiving_company,
			service,
			subtotal,
			discount_percentage
		} = req.body;

		const newInvoice = new Invoice({
			invoice_number,
			issue_date,
			issuing_company,
			receiving_company,
			service,
			subtotal,
			discount_percentage,
			discount: (subtotal * discount_percentage) / 100,
			subtotal_with_discount: subtotal - ((subtotal * discount_percentage) / 100),
			vat: (subtotal - ((subtotal * discount_percentage) / 100)) * 0.15,
			total: (subtotal - ((subtotal * discount_percentage) / 100)) * 1.15,
			created_by: req.user.id,
			status: 'Pending'
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
			invoice_number,
			issue_date,
			issuing_company,
			receiving_company,
			service,
			subtotal,
			discount_percentage,
			status
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de factura inválido' });
		}

		const updatedInvoice = await Invoice.findByIdAndUpdate(
			id,
			{
				invoice_number,
				issue_date,
				issuing_company,
				receiving_company,
				service,
				subtotal,
				discount_percentage,
				discount: (subtotal * discount_percentage) / 100,
				subtotal_with_discount: subtotal - ((subtotal * discount_percentage) / 100),
				vat: (subtotal - ((subtotal * discount_percentage) / 100)) * 0.15,
				total: (subtotal - ((subtotal * discount_percentage) / 100)) * 1.15,
				status
			},
			{ new: true }
		);

		if (!updatedInvoice) {
			return res.status(404).json({ error: 'Factura no encontrada' });
		}

		res.status(200).json(updatedInvoice);
	} catch (error) {
		res.status(500).json({ message: error.message });
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
