/*
    Description: Notification
    By: Fabiana Liria
    version: 1.6
*/
const jwt = require('jsonwebtoken');
const transporter = require('../helpers/mailerHelper');
const bcrypt = require('bcryptjs');

exports.sendPasswordCreationEmail = async user => {
	try {
		const resetLink = `http://localhost:3000/create-password?userId=${user._id}`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: user.email,
			subject: 'Crea tu contraseña',
			text: `Hola ${user.name}, por favor crea tu contraseña en el siguiente enlace: ${resetLink}`,
		};

		await transporter.sendMail(mailOptions);
		console.log('Correo enviado con éxito.');
	} catch (error) {
		console.error('Error al enviar el correo:', error);
		throw new Error(
			'No se pudo enviar el correo de creación de contraseña',
			error,
		);
	}
};

exports.sendPasswordResetEmail = async user => {
	try {
		const verificationCode = Math.floor(
			100000 + Math.random() * 900000,
		).toString(); // Genera un código de 6 dígitos

		// Guarda el código sin encriptar en el usuario en la base de datos
		user.resetCode = verificationCode;
		await user.save();

		// Envía el correo con el código
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: user.email,
			subject: 'Código de verificación para el restablecimiento de contraseña',
			text: `Tu código de verificación es: ${verificationCode}`,
		};

		await transporter.sendMail(mailOptions);
		console.log('Correo enviado con éxito.');
	} catch (error) {
		console.error('Error al enviar el correo:', error);
		throw new Error(
			'No se pudo enviar el correo de restablecimiento de contraseña',
		);
	}
};

//TODO: CREAR ESTA FUNCIONALIDAD. Función para enviar correo cuando faltan campos en un documento
/*exports.sendMissingFieldsEmail = async (analysisResult, fileName) => {
  const subject = `Campos faltantes en el documento: ${fileName}`;
  const missingFields = analysisResult.missing_fields.join(', ');
  const text = `
    Estimado/a,

    Se ha detectado que el siguiente documento tiene campos faltantes:

    Documento: ${fileName}
    Campos faltantes: ${missingFields}

    Por favor revise y complete los campos.

    Gracias,
    El equipo de validación de ENAP
  `;


  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to: user.email,
    subject: subject,
    text: text,
  };

  await transporter.sendMail(mailOptions);
};*/
