const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

describe('Auth Model Test Suite', () => {
    let mongoServer;
    let testUser;
    const validUserData = {
        name: 'Carlos',
        last_name: 'Perez',
        phone: '0987654321',
        company_name: 'Empresa Ejemplo',
        ruc: '1757797202001',
        email: 'carlos@example.com',
        password: 'securepassword',
        role: 'Administrador',
        status: 'Activo'
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri(), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }, 30000);

        // Crear usuario de prueba
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(validUserData.password, salt);
        testUser = new User({
            ...validUserData,
            password: hashedPassword
        });
        await testUser.save();
    }, 30000);

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    describe('Login Validations', () => {
        it('debería encontrar un usuario por email', async () => {
            const user = await User.findOne({ email: validUserData.email });
            expect(user).toBeDefined();
            expect(user.email).toBe(validUserData.email);
        });

        it('debería validar contraseña correctamente', async () => {
            const testPassword = 'testPassword123';

            const testLoginUser = new User({
                ...validUserData,
                email: 'test.login@example.com',
                password: testPassword
            });
            await testLoginUser.save();

            const user = await User.findOne({ email: 'test.login@example.com' });
            const isMatch = await bcrypt.compare(testPassword, user.password);
            expect(isMatch).toBe(true);
        });

        it('debería fallar con contraseña incorrecta', async () => {
            const user = await User.findOne({ email: validUserData.email });
            const isMatch = await bcrypt.compare('wrongpassword', user.password);
            expect(isMatch).toBe(false);
        });

        it('debería fallar con email no registrado', async () => {
            const user = await User.findOne({ email: 'noexiste@example.com' });
            expect(user).toBeNull();
        });

        it('debería fallar si el usuario está inactivo', async () => {
            const user = await User.findOne({ email: validUserData.email });
            user.status = 'Inactivo';
            await user.save();

            const inactiveUser = await User.findOne({
                email: validUserData.email,
                status: 'Activo'
            });
            expect(inactiveUser).toBeNull();

            user.status = 'Activo';
            await user.save();
        });
    });

    describe('Token Validations', () => {
        it('debería generar un token válido', () => {
            const token = jwt.sign(
                {
                    id: testUser._id,
                    name: testUser.name,
                    email: testUser.email,
                    role: testUser.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '10h' }
            );

            expect(token).toBeDefined();
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            expect(decoded).toBeDefined();
            expect(decoded.email).toBe(testUser.email);
        });

        it('debería fallar con un token inválido', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => {
                jwt.verify(invalidToken, process.env.JWT_SECRET || 'your-secret-key');
            }).toThrow();
        });

        it('debería actualizar last_login al iniciar sesión', async () => {
            const user = await User.findOne({ email: validUserData.email });
            const originalLastLogin = user.last_login;

            user.last_login = new Date();
            await user.save();

            const updatedUser = await User.findOne({ email: validUserData.email });
            expect(updatedUser.last_login).not.toEqual(originalLastLogin);
        });
    });

    describe('Email Validations', () => {
        it('debería validar formato de email correcto', async () => {
            const user = new User({
                ...validUserData,
                email: 'correo.valido@example.com'
            });
            const validateError = user.validateSync();
            expect(validateError).toBeUndefined();
        });

        it('debería fallar con formato de email incorrecto', async () => {
            const user = new User({
                ...validUserData,
                email: 'correo-invalido'
            });

            let err;
            try {
                await user.validate();
            } catch (error) {
                err = error;
            }

            expect(err).toBeDefined();
            expect(err.errors.email).toBeDefined();
            expect(err.errors.email.message).toBe('El correo electrónico ingresado no es válido.');
        });

        it('debería fallar al crear usuario con email duplicado', async () => {
            const duplicateUser = new User(validUserData);

            let err;
            try {
                await duplicateUser.save();
            } catch (error) {
                err = error;
            }

            expect(err).toBeDefined();
            expect(err.code).toBe(11000);
        });
    });
});
