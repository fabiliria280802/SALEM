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

exports.getInvoicesStats = [
    authMiddleware,
    async (req, res) => {
        try {
            const invoices = await Invoice.find()
                .select('status validation_errors missing_errors invoice_number')
                .lean();

            if (!invoices.length) {
                return res
                    .status(404)
                    .json({ message: 'No se encontraron facturas procesadas.' });
            }

            const rejectedInvoices = invoices.filter((i) => i.status === 'Denegado');

            const stats = {
                totalInvoices: invoices.length,
                totalRejected: rejectedInvoices.length,
                totalAccepted: invoices.length - rejectedInvoices.length,
                avgValidationErrors:
                    rejectedInvoices.reduce(
                        (sum, i) => sum + (i.validation_errors?.length || 0),
                        0
                    ) / (rejectedInvoices.length || 1),
                rejectedDetails: rejectedInvoices.map((invoice) => ({
                    invoiceNumber: invoice.invoice_number,
                    validationErrors: invoice.validation_errors,
                    missingErrors: invoice.missing_errors,
                })),
            };

            res.status(200).json(stats);
        } catch (error) {
            console.error('Error al obtener estadísticas de facturas:', error);
            res.status(500).json({ message: 'Error al obtener estadísticas de facturas', error });
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
