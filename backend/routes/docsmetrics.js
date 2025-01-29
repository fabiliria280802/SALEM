const express = require('express');
const {
	createDocsMetrics,
    getAllDocsMetrics,
    getDocsMetricsById,
    updateDocsMetrics,
} = require('../controllers/docsMetricsController');

const router = express.Router();

router.get('/', getAllDocsMetrics);
router.get('/:id', getDocsMetricsById);
router.post('/', createDocsMetrics);
router.put('/:id', updateDocsMetrics);

module.exports = router;