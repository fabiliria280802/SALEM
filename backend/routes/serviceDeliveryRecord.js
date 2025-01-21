const express = require('express');
const {
	createServiceRecord,
	getServiceDeliveryRecordById,
	updateServiceRecord,
	getAllServiceDeliveryRecords,
	deleteServiceDeliveryRecord,
} = require('../controllers/serviceDeliveryRecordController');

const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', upload.single('file'), createServiceRecord);
router.post('/', getAllServiceDeliveryRecords);
router.get('/:id', getServiceDeliveryRecordById);
router.put('/:id', updateServiceRecord);
router.delete('/:id', deleteServiceDeliveryRecord);

module.exports = router;
