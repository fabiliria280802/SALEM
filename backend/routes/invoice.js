const express = require('express');
const {
	createInvoice,
	getAllInvoices,
	getInvoiceById,
	updateInvoice,
	deleteInvoice,
	getInvoiceByNumber,
} = require('../controllers/invoiceController');

const { isAdmin } = require('../helpers/roleHelper');
const router = express.Router();

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/number/:invoice_number', getInvoiceByNumber);
router.post('/', createInvoice);
router.put('/:id', isAdmin, updateInvoice);
router.delete('/:id', isAdmin, deleteInvoice);
module.exports = router;
