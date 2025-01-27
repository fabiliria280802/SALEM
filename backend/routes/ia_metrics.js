const express = require('express');
const {
    createAiMetrics,
    getAllAiMetrics,
    getAiMetricsById,
    updateAiMetrics,
    deleteAiMetrics,
    getAiMetricsByModelVersion,
    getAiStats,
} = require('../controllers/aiMetricsController');

const { isAdmin } = require('../helpers/roleHelper');
const router = express.Router();

// Rutas existentes
router.get('/', getAllAiMetrics);
router.get('/ai-stats', getAiStats);
router.get('/:id', getAiMetricsById);
router.get('/model/:ai_model_version', getAiMetricsByModelVersion);
router.post('/', createAiMetrics);
router.put('/:id', isAdmin, updateAiMetrics);
router.delete('/:id', isAdmin, deleteAiMetrics);

module.exports = router;