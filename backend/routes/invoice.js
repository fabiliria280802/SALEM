const express = require('express');
const {
	createInvoice,
	getAllInvoices,
	getInvoiceById,
	updateInvoice,
	deleteInvoice,
	getInvoiceByNumber,
} = require('../controllers/invoiceController');

const { upload } = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/', upload.single('file'), createInvoice);
router.post('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/number/:invoice_number', getInvoiceByNumber);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
module.exports = router;
