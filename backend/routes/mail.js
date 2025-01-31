const express = require('express');
const router = express.Router();
const {
	sendManualReviewNotificationEmail,
	sendPasswordCreationEmail,
} = require('../controllers/notificationController');
const User = require('../models/User')

router.post('/send-manual-review-notification', async (req, res) => {
    try {
		const { documentName, contractNumber, senderName, companyName } = req.body;

        console.log("Datos recibidos en la solicitud:", req.body); 

        // Buscar usuarios con rol "Administrador" o "Gestor"
        const adminAndManagers = await User.find({ role: { $in: ['Administrador', 'Gestor'] } });

        if (!adminAndManagers.length) {
            console.error("No hay administradores o gestores en la BD."); 
            return res.status(404).json({ message: 'No hay administradores o gestores registrados.' });
        }

        console.log("Usuarios administradores/gestores encontrados:", adminAndManagers);

        // Enviar correos
        await Promise.all(
			adminAndManagers.map(user =>
				sendManualReviewNotificationEmail(user, documentName, contractNumber, senderName, companyName)
			)
        );

        res.status(200).json({ message: 'Correos enviados con éxito.' });
    } catch (error) {
        console.error("Error en el backend al enviar el correo:", error);
        res.status(500).json({ message: 'Error al enviar correos.', error: error.message });
    }
});


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
