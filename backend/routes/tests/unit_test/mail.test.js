const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const User = require('../../models/User');
const { sendPasswordCreationEmail, sendPasswordResetEmail } = require('../../controllers/notificationController');

// Mock para nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue({ response: 'Email sent' })
    })
}));

describe('Mail Routes', () => {
    let mongoServer;
    let testUser;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        testUser = await User.create({
            name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            role: 'Proveedor',
            ruc: '1234567890001'
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('POST /api/mail/send-password-email', () => {
        it('debería enviar email de creación de contraseña', async () => {
            const response = await request(app)
                .post('/api/mail/send-password-email')
                .send({
                    email: testUser.email,
                    name: testUser.name,
                    userId: testUser._id
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Correo enviado correctamente');
        });

        it('debería manejar errores de envío', async () => {
            // Mock para simular error
            jest.spyOn(sendPasswordCreationEmail, 'mockRejectedValueOnce')
                .mockRejectedValueOnce(new Error('Email error'));

            const response = await request(app)
                .post('/api/mail/send-password-email')
                .send({
                    email: 'invalid@email',
                    name: 'Test',
                    userId: 'invalid-id'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error al enviar el correo');
        });
    });

    describe('POST /api/mail/send-reset-password-email', () => {
        it('debería enviar email de reset de contraseña', async () => {
            const response = await request(app)
                .post('/api/mail/send-reset-password-email')
                .send({
                    email: testUser.email,
                    name: testUser.name,
                    resetCode: '123456'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Correo enviado correctamente');
        });

        it('debería manejar errores de envío', async () => {
            // Mock para simular error
            jest.spyOn(sendPasswordResetEmail, 'mockRejectedValueOnce')
                .mockRejectedValueOnce(new Error('Email error'));

            const response = await request(app)
                .post('/api/mail/send-reset-password-email')
                .send({
                    email: 'invalid@email',
                    name: 'Test',
                    resetCode: '123456'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error al enviar el correo');
        });
    });

    describe('Validaciones de correo', () => {
        it('debería validar formato de email', async () => {
            const response = await request(app)
                .post('/api/mail/send-password-email')
                .send({
                    email: 'invalid-email',
                    name: 'Test',
                    userId: testUser._id
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Email inválido');
        });

        it('debería validar campos requeridos', async () => {
            const response = await request(app)
                .post('/api/mail/send-password-email')
                .send({
                    email: testUser.email
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Faltan campos requeridos');
        });
    });
});
