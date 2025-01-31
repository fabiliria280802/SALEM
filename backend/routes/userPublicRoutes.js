const express = require('express');
const router = express.Router();
const {
	getUserByEmail,
	verifyResetCode,
	getUserByRuc,
} = require('../controllers/userController');

// Ruta pública para obtener usuario por correo
router.get('/email/:email', getUserByEmail);
router.post('/verify-reset-code', verifyResetCode);
router.get('/ruc/:ruc', getUserByRuc);

module.exports = router;
