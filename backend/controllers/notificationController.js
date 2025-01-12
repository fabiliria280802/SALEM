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
			subject: '¡Bienvenido a Salem! Crea tu contraseña',
			html: `
				<!DOCTYPE html>
				<html lang="es">
				<head>
				  <meta charset="UTF-8">
				  <meta name="viewport" content="width=device-width, initial-scale=1.0">
				</head>
				<body style="margin: 0; padding: 0; background-color: #f2f2f2; font-family: Arial, sans-serif;">
				  <!-- Tabla principal con fondo gris claro -->
				  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f2f2;">
				    <tr>
				      <td align="center" valign="top">
				        <!-- Tabla interna para contenido centrado -->
				        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; margin: auto; padding: 20px; border-radius: 8px;">
				          <!-- Imagen centrada -->
				          <tr>
				            <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
				              <img src="https://i.postimg.cc/1zT2r7ny/salem.png" alt="Te damos la bienvenida" width="200" style="display: block; margin: 0 auto;">
				            </td>
				          </tr>
				          <!-- Cuadrado blanco con texto centrado, tamaño fijo -->
				          <tr>
				            <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
				              <div style="width: 200px; height: 200px; background-color: #ffffff; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 0 auto; padding: 15px; box-sizing: border-box;">
				                <!-- Saludo -->
				                <p style="font-size: 13px; font-weight: bold; color: #000; margin: 5px 0;">¡Hola ${user.name}!</p>
				                <!-- Texto descriptivo -->
				                <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
				                  Estás a un paso de terminar tu registro. Da clic abajo y crea tu contraseña.
				                </p>
				                <!-- Botón centrado -->
				                <div style="margin-top: 10px;">
				                  <a href="${resetLink}" style="background-color: #0056b3; color: #ffffff; text-decoration: none; padding: 5px 10px; border-radius: 5px; font-size: 10px; font-weight: bold; display: inline-block;">Nueva contraseña</a>
				                </div>
				              </div>
				            </td>
				          </tr>
				          <!-- Texto de copyright -->
				          <tr>
				            <td align="center" style="padding-top: 15px;">
				              <p style="font-size: 12px; color: #666; font-weight: normal; margin: 0;">Copyright ® ENAP Ecuador.</p>
				            </td>
				          </tr>
				        </table>
				      </td>
				    </tr>
				  </table>
				</body>
				</html>
			`
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
