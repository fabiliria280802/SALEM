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
			subject: `¡Bienvenido/a ${user.name} a Salem! Crea tu contraseña.`,
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
				              <img src="https://files.catbox.moe/js7pky.png" alt="Te damos la bienvenida" width="200" style="display: block; margin: 0 auto;">
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
			100000 + Math.random() * 900000
		).toString(); // Genera un código de 6 dígitos

		// Guarda el código sin encriptar en el usuario en la base de datos
		user.resetCode = verificationCode;
		await user.save();

		// Envía el correo con el código
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: user.email,
			subject: `Hola ${user.name}, restablece tu contraseña.`,
			html: `
				<!DOCTYPE html>
				<html lang="es">
				<head>
				  <meta charset="UTF-8">
				  <meta name="viewport" content="width=device-width, initial-scale=1.0">
				  <title>Correo Electrónico</title>
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
				              <img src="https://files.catbox.moe/jet02c.png" alt="Recupera tu contraseña" width="200" style="display: block; margin: 0 auto;">
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
				                  Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:
				                </p>
				                <!-- Código de verificación -->
				                <div style="margin-top: 10px; font-size: 16px; font-weight: bold; color: #0056b3; background-color: #e6f2ff; padding: 10px 20px; border-radius: 5px;">
				                  ${verificationCode}
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
			'No se pudo enviar el correo de restablecimiento de contraseña',
			error
		);
	}
};

exports.sendDocumentApprovalEmail = async (user, documentName, contractNumber) => {
	try {
	  const mailOptions = {
		from: process.env.EMAIL_USER,
		to: user.email,
		subject: `¡Tu documento ${documentName} del contrato ${contractNumber} ha sido aprobado!`,
		html: `
		  <!DOCTYPE html>
		  <html lang="es">
		  <head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Documento Aprobado</title>
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
						<img src="https://files.catbox.moe/i7f2l1.png" alt="Documento Aprobado" width="200" style="display: block; margin: 0 auto;">
					  </td>
					</tr>
					<!-- Cuadro blanco con texto centrado -->
					<tr>
					  <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
						<div style="width: 200px; background-color: #ffffff; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 0 auto; padding: 15px; box-sizing: border-box;">
						  <!-- Saludo -->
						  <p style="font-size: 13px; font-weight: bold; color: #000; margin: 5px 0;">¡Hola ${user.name}!</p>
						  <!-- Texto descriptivo -->
						  <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
							Nos complace informarte que tu documento <strong>${documentName}</strong>, asociado al contrato número <strong>${contractNumber}</strong>, ha sido aprobado exitosamente.
						  </p>
						  <!-- Mensaje adicional -->
						  <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
							El proceso continuará al siguiente paso. Si tienes alguna duda, no dudes en contactarnos.
						  </p>
						  <!-- Agradecimiento -->
						  <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
							¡Gracias por confiar en nosotros!
						  </p>
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
		`,
	  };
  
	  await transporter.sendMail(mailOptions);
	  console.log('Correo de aprobación enviado con éxito.');
	} catch (error) {
	  console.error('Error al enviar el correo de aprobación:', error);
	  throw new Error('No se pudo enviar el correo de aprobación.');
	}
  };
  
  exports.sendDocumentRejectionEmail = async (user, documentName, contractNumber) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Tu documento ${documentName} del contrato ${contractNumber} ha sido rechazado`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documento Rechazado</title>
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
                        <img src="https://files.catbox.moe/man26w.png" alt="Documento Rechazado" width="200" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    <!-- Cuadro blanco con texto centrado -->
                    <tr>
                      <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
                        <div style="width: 200px; background-color: #ffffff; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 0 auto; padding: 15px; box-sizing: border-box;">
                          <!-- Saludo -->
                          <p style="font-size: 13px; font-weight: bold; color: #000; margin: 5px 0;">¡Hola ${user.name}!</p>
                          <!-- Texto descriptivo -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Lamentamos informarte que tu documento <strong>${documentName}</strong>, asociado al contrato número <strong>${contractNumber}</strong>, ha sido rechazado.
                          </p>
                          <!-- Instrucciones adicionales -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Por favor, revisa los errores indicados en el sistema, corrige el documento y vuelve a cargarlo. Si lo prefieres, también puedes solicitar una revisión manual.
                          </p>
                          <!-- Mensaje de ayuda -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Si necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para apoyarte!
                          </p>
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
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Correo de rechazo enviado con éxito.');
    } catch (error) {
      console.error('Error al enviar el correo de rechazo:', error);
      throw new Error('No se pudo enviar el correo de rechazo.');
    }
  };

  exports.sendManualReviewRequestEmail = async (user, documentName, contractNumber) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Tu documento ${documentName} del contrato ${contractNumber} está en revisión manual`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Documento en Revisión Manual</title>
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
                        <img src="https://files.catbox.moe/oq0o8s.png" alt="Documento en Revisión Manual" width="200" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    <!-- Cuadro blanco con texto centrado -->
                    <tr>
                      <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
                        <div style="width: 200px; background-color: #ffffff; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 0 auto; padding: 15px; box-sizing: border-box;">
                          <!-- Saludo -->
                          <p style="font-size: 13px; font-weight: bold; color: #000; margin: 5px 0;">¡Hola ${user.name}!</p>
                          <!-- Texto descriptivo -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Te informamos que tu documento <strong>${documentName}</strong>, asociado al contrato número <strong>${contractNumber}</strong>, ha sido enviado a revisión manual con el equipo de ENAP.
                          </p>
                          <!-- Mensaje adicional -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Pronto recibirás una respuesta sobre el estado de tu caso. Agradecemos tu paciencia mientras procesamos esta solicitud.
                          </p>
                          <!-- Mensaje de ayuda -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Si necesitas más información, no dudes en contactarnos. ¡Estamos aquí para apoyarte!
                          </p>
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
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Correo de solicitud de revisión manual enviado con éxito.');
    } catch (error) {
      console.error('Error al enviar el correo de solicitud de revisión manual:', error);
      throw new Error('No se pudo enviar el correo de solicitud de revisión manual.');
    }
  };

  exports.sendManualReviewNotificationEmail = async (enapUser, documentName, contractNumber, senderName) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: enapUser.email,
        subject: `Nuevo documento en revisión manual: ${documentName} del contrato ${contractNumber}`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notificación de Revisión Manual</title>
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
                        <img src="https://files.catbox.moe/oq0o8s.png" alt="Documento en Revisión Manual" width="200" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    <!-- Cuadro blanco con texto centrado -->
                    <tr>
                      <td align="center" valign="top" style="background-color: #f2f2f2; padding: 10px;">
                        <div style="width: 200px; background-color: #ffffff; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin: 0 auto; padding: 15px; box-sizing: border-box;">
                          <!-- Saludo -->
                          <p style="font-size: 13px; font-weight: bold; color: #000; margin: 5px 0;">¡Hola ${enapUser.name}!</p>
                          <!-- Texto descriptivo -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Has recibido un nuevo documento <strong>${documentName}</strong>, asociado al contrato número <strong>${contractNumber}</strong>, para revisión manual.
                          </p>
                          <!-- Instrucción -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            Por favor, revisa el documento y toma una decisión: <strong>aprobarlo</strong> o <strong>rechazarlo</strong>.
                          </p>
                          <!-- Mensaje adicional -->
                          <p style="font-size: 13px; font-weight: normal; color: #000; line-height: 1.3; margin: 5px 0;">
                            El documento fue enviado por <strong>${companyName}</strong>.
                          </p>
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
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Correo de notificación para revisión manual enviado con éxito.');
    } catch (error) {
      console.error('Error al enviar el correo de notificación de revisión manual:', error);
      throw new Error('No se pudo enviar el correo de notificación de revisión manual.');
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
