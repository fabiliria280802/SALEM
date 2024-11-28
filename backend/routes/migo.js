const express = require('express');
const {
	createMigo,
	getAllMigos,
	getMigoById,
	updateMigo,
	deleteMigo,
	getMigosByType,
} = require('../controllers/migoController');

const { isAdmin } = require('../helpers/roleHelper');
const router = express.Router();

router.get('/', getAllMigos);
router.get('/:id', getMigoById);
router.get('/type/:movement_type', getMigosByType);
router.post('/', createMigo);
router.put('/:id', isAdmin, updateMigo);
router.delete('/:id', isAdmin, deleteMigo);

module.exports = router;
