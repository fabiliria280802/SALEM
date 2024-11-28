const express = require('express');
const {
	getReportById,
	getAllReports,
	createReport,
	updateReport,
	deleteReport,
} = require('../controllers/reportController');

const { isAdmin } = require('../helpers/roleHelper');
const router = express.Router();

router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', createReport);
router.put('/:id', isAdmin, updateReport);
router.delete('/:id', isAdmin, deleteReport);

module.exports = router;
