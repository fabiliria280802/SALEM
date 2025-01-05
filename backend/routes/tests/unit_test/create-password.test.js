const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

describe('Create Password Routes', () => {
    let mongoServer;
    let testUser;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        // Crear usuario de prueba sin contraseña
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

    describe('POST /api/create-password/:userId', () => {
        it('debería crear una contraseña válida', async () => {
            const response = await request(app)
                .post(`/api/create-password/${testUser._id}`)
                .send({
                    password: 'ValidPass123'
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Contraseña creada con éxito');

            // Verificar que la contraseña fue hasheada
            const updatedUser = await User.findById(testUser._id);
            const isPasswordValid = await bcrypt.compare('ValidPass123', updatedUser.password);
            expect(isPasswordValid).toBe(true);
        });

        it('debería fallar con contraseña débil', async () => {
            const response = await request(app)
                .post(`/api/create-password/${testUser._id}`)
                .send({
                    password: 'weak'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('La contraseña debe tener al menos 6 caracteres');
        });

        it('debería fallar sin mayúsculas/números', async () => {
            const response = await request(app)
                .post(`/api/create-password/${testUser._id}`)
                .send({
                    password: 'onlylowercase'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(
                'La contraseña debe tener al menos una letra mayúscula, una letra minúscula y un número'
            );
        });

        it('debería fallar con usuario inválido', async () => {
            const response = await request(app)
                .post('/api/create-password/invalid-id')
                .send({
                    password: 'ValidPass123'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Usuario no encontrado');
        });
    });
});
