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
