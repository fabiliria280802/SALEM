const express = require('express');
const {
<<<<<<< Updated upstream
	createServiceRecord,
	getServiceRecordById,
	updateServiceRecord,
	getAllServiceDeliveryRecords,
	deleteServiceDeliveryRecord,
=======
    createServiceRecord,
    getServiceDeliveryRecordById,
    updateServiceRecord,
    getAllServiceDeliveryRecords,
    deleteServiceDeliveryRecord,
    getServiceRecordsStats,
>>>>>>> Stashed changes
} = require('../controllers/serviceDeliveryRecordController');

const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

// Rutas existentes
router.post('/', upload.single('file'), createServiceRecord);
<<<<<<< Updated upstream
router.get('/', getAllServiceDeliveryRecords);
router.get('/:id', getServiceRecordById);
router.put('/:id', updateServiceRecord);
=======
router.post('/getAll', getAllServiceDeliveryRecords);
router.get('/service-records-stats', getServiceRecordsStats);
router.get('/:id', getServiceDeliveryRecordById);
router.put('/:id', upload.single('file'), updateServiceRecord);
>>>>>>> Stashed changes
router.delete('/:id', deleteServiceDeliveryRecord);

module.exports = router;