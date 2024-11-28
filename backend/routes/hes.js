const express = require('express');
const {
	createHes,
	getAllHes,
	getHesById,
	updateHes,
	deleteHes,
	getHesByProviderRuc,
} = require('../controllers/hesController');

const { isAdmin } = require('../helpers/roleHelper');
const router = express.Router();

router.get('/', getAllHes);
router.get('/:id', getHesById);
router.get('/provider/:provider_ruc', getHesByProviderRuc);
router.post('/', createHes);
router.put('/:id', isAdmin, updateHes);
router.delete('/:id', isAdmin, deleteHes);

module.exports = router;
