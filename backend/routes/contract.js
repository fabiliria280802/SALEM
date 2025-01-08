const express = require('express');
const {
	createContract,
	getContractById,
	updateContract,
	deleteContract,
} = require('../controllers/contractController');
const { upload } = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/', upload.single('file'), createContract);
router.get('/:id', getContractById);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

module.exports = router;
