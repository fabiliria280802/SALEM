const express = require('express');
const {
<<<<<<< Updated upstream
	createContract,
	getContractById,
	updateContract,
	deleteContract,
=======
    createContract,
    getContractById,
    getAllContracts,
    updateContract,
    deleteContract,
    getRejectedContracts,
>>>>>>> Stashed changes
} = require('../controllers/contractController');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Rutas existentes
router.post('/', upload.single('file'), createContract);
router.post('/getAll', getAllContracts);
router.get('/contracts-stats', getRejectedContracts);
router.get('/:id', getContractById);
<<<<<<< Updated upstream
router.put('/:id', updateContract);
=======
router.put('/:id', upload.single('file'), updateContract);
>>>>>>> Stashed changes
router.delete('/:id', deleteContract);
module.exports = router;