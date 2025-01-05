const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { sendPasswordCreationEmail, sendPasswordResetEmail } = require('../notificationController');
const User = require('../../models/User');
const transporter = require('../../helpers/mailerHelper');

// Mock del transporter de nodemailer
jest.mock('../../helpers/mailerHelper', () => ({
    sendMail: jest.fn()
}));

describe('Notification Controller Integration Tests', () => {
    let mongoServer;
    let testUser;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    beforeEach(async () => {
        // Crear usuario de prueba antes de cada test con datos válidos
        testUser = await User.create({
            name: 'Test',
            last_name: 'User',
            phone: '0987654321', // 10 dígitos exactos
            company_name: 'Empresa Ejemplo', // Solo letras y espacios
            email: 'fabiliria@gmail.com',
            role: 'Proveedor',
            ruc: '1757797202001' // RUC válido
        });

        // Limpiar mocks antes de cada test
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await User.deleteMany();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('sendPasswordCreationEmail', () => {
        it('debería enviar email de creación de contraseña correctamente', async () => {
            // Configurar mock para simular envío exitoso
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordCreationEmail(testUser);

            // Verificar que se llamó a sendMail con los parámetros correctos
            expect(transporter.sendMail).toHaveBeenCalledTimes(1);
            expect(transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: testUser.email,
                    subject: 'Crea tu contraseña',
                    text: expect.stringContaining(testUser.name)
                })
            );
        });

        it('debería manejar errores de envío', async () => {
            // Configurar mock para simular error
            const errorMessage = 'Error al enviar email';
            transporter.sendMail.mockRejectedValueOnce(new Error(errorMessage));

            await expect(sendPasswordCreationEmail(testUser))
                .rejects
                .toThrow('No se pudo enviar el correo de creación de contraseña');
        });

        it('debería incluir el link correcto en el email', async () => {
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordCreationEmail(testUser);

            const expectedLink = `http://localhost:3000/create-password?userId=${testUser._id}`;
            expect(transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining(expectedLink)
                })
            );
        });
    });

    describe('sendPasswordResetEmail', () => {
        it('debería enviar email de reset de contraseña correctamente', async () => {
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordResetEmail(testUser);

            // Verificar que se guardó el código de reset
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetCode).toBeDefined();
            expect(updatedUser.resetCode.length).toBe(6);

            // Verificar el envío del email
            expect(transporter.sendMail).toHaveBeenCalledTimes(1);
            expect(transporter.sendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: testUser.email,
                    subject: 'Código de verificación para el restablecimiento de contraseña',
                    text: expect.stringContaining(updatedUser.resetCode)
                })
            );
        });

        it('debería manejar errores de envío', async () => {
            const errorMessage = 'Error al enviar email';
            transporter.sendMail.mockRejectedValueOnce(new Error(errorMessage));

            await expect(sendPasswordResetEmail(testUser))
                .rejects
                .toThrow('No se pudo enviar el correo de restablecimiento de contraseña');
        });

        it('debería generar un código de verificación válido', async () => {
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordResetEmail(testUser);

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetCode).toMatch(/^\d{6}$/); // Verifica que sea un número de 6 dígitos
        });
    });

    describe('Integración con base de datos', () => {
        it('debería actualizar el usuario con el código de reset', async () => {
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordResetEmail(testUser);

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetCode).toBeDefined();
            expect(typeof updatedUser.resetCode).toBe('string');
        });

        it('debería mantener otros campos del usuario sin cambios', async () => {
            transporter.sendMail.mockResolvedValueOnce({ response: 'Email sent' });

            await sendPasswordResetEmail(testUser);

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.name).toBe(testUser.name);
            expect(updatedUser.email).toBe(testUser.email);
            expect(updatedUser.role).toBe(testUser.role);
        });
    });

    describe('Validaciones de seguridad', () => {
        it('debería generar códigos únicos para cada solicitud', async () => {
            transporter.sendMail.mockResolvedValue({ response: 'Email sent' });

            await sendPasswordResetEmail(testUser);
            const firstCode = (await User.findById(testUser._id)).resetCode;

            await sendPasswordResetEmail(testUser);
            const secondCode = (await User.findById(testUser._id)).resetCode;

            expect(firstCode).not.toBe(secondCode);
        });

        it('debería manejar múltiples solicitudes de reset simultáneas', async () => {
            // Configurar el mock para manejar múltiples llamadas
            transporter.sendMail.mockImplementation(() =>
                Promise.resolve({ response: 'Email sent' })
            );

            // Crear un array de promesas con un retraso entre cada una
            const promises = Array(3).fill().map((_, index) =>
                new Promise(resolve =>
                    setTimeout(() =>
                        resolve(sendPasswordResetEmail(testUser)),
                        index * 100
                    )
                )
            );

            // Esperar a que todas las promesas se resuelvan
            await expect(Promise.all(promises)).resolves.not.toThrow();

            // Verificar el resultado final
            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser.resetCode).toBeDefined();
            expect(updatedUser.resetCode.length).toBe(6);

            // Verificar que se llamó al transporter el número correcto de veces
            expect(transporter.sendMail).toHaveBeenCalledTimes(3);
        });

        // Agregar un nuevo test para verificar el manejo de errores en solicitudes simultáneas
        it('debería manejar errores en solicitudes simultáneas', async () => {
            // Configurar el mock para alternar entre éxito y error
            let callCount = 0;
            transporter.sendMail.mockImplementation(() => {
                callCount++;
                if (callCount % 2 === 0) {
                    return Promise.reject(new Error('Error simulado'));
                }
                return Promise.resolve({ response: 'Email sent' });
            });

            const promises = Array(2).fill().map(() =>
                sendPasswordResetEmail(testUser).catch(error => error)
            );

            const results = await Promise.all(promises);

            expect(results.some(result => result instanceof Error)).toBeTruthy();
            expect(results.some(result => !(result instanceof Error))).toBeTruthy();
        });
    });
});
