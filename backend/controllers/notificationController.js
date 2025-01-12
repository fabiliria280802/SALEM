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
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Crea tu contraseña</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            background-color: #f3f3f3;
                            font-family: Arial, sans-serif;
                            text-align: center;
                        }
                        .container {
                            width: 100%;
                            padding: 20px;
                            background-color: #f3f3f3;
                            display: flex;
                            justify-content: center;
                        }
                        .box {
                            width: 500px;
                            background-color: #ffffff;
                            border-radius: 15px;
                            padding: 20px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                            margin-bottom: 10px;
                        }
                        p {
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 0;
                            margin-bottom: 20px;
                        }
                        .button {
                            background-color: #1e5f74;
                            color: #ffffff;
                            font-size: 18px;
                            font-weight: bold;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 10px;
                            display: inline-block;
                        }
                        .button:hover {
                            background-color: #174954;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="box">
                            <h1>¡Hola ${user.name}!</h1>
                            <p>Estás a un paso de terminar tu registro. Da clic en el botón a continuación para crear tu contraseña.</p>
                            <a href="${resetLink}" class="button">Nueva contraseña</a>
                        </div>
                    </div>
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
