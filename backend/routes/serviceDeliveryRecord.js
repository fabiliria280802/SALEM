const express = require('express');
const {
	createServiceRecord,
	getServiceRecordById,
	updateServiceRecord,
	getAllServiceDeliveryRecords,
	deleteServiceDeliveryRecord,
} = require('../controllers/serviceDeliveryRecordController');

const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', upload.single('file'), createServiceRecord);
router.get('/', getAllServiceDeliveryRecords);
router.get('/:id', getServiceRecordById);
router.put('/:id', updateServiceRecord);
router.delete('/:id', deleteServiceDeliveryRecord);

module.exports = router;
