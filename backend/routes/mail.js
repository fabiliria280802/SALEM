const express = require('express');
const router = express.Router();
const {
	sendPasswordCreationEmail,
} = require('../controllers/notificationController');

router.post('/send-password-email', async (req, res) => {
	const user = req.body;
	try {
		await sendPasswordCreationEmail(user);
		res.status(200).json({ message: 'Correo enviado correctamente' });
	} catch (error) {
		console.error('Error al enviar correo: ', error);
		res
			.status(500)
			.json({ message: 'Error al enviar el correo', error: error.message });
	}
});

router.post('/send-reset-password-email', async (req, res) => {
	const user = req.body;
	try {
		await sendPasswordResetEmail(user);
		res.status(200).json({ message: 'Correo enviado correctamente' });
	} catch (error) {
		console.error('Error al enviar correo: ', error);
		res
			.status(500)
			.json({ message: 'Error al enviar el correo', error: error.message });
	}
});

module.exports = router;
