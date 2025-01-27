const express = require('express');
const {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    getInvoiceByNumber,
    getInvoicesStats,
} = require('../controllers/invoiceController');

const { upload } = require('../middleware/uploadMiddleware');
const router = express.Router();

// Rutas existentes
router.post('/', upload.single('file'), createInvoice);
<<<<<<< Updated upstream
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.get('/number/:invoice_number', getInvoiceByNumber);
router.put('/:id', updateInvoice);
=======
router.post('/getAll', getAllInvoices);
router.get('/invoices-stats', getInvoicesStats);
router.get('/:id', getInvoiceById);
router.get('/number/:invoice_number', getInvoiceByNumber);
router.put('/:id', upload.single('file'), updateInvoice);
>>>>>>> Stashed changes
router.delete('/:id', deleteInvoice);

// Ruta para estadísticas de facturas


module.exports = router;


