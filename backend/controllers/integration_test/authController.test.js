const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const authController = require('../authController');

describe('AuthController - Pruebas de Integración', () => {
	let mongoServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		await User.deleteMany({});
	});

	describe('login', () => {
		it('debería autenticar exitosamente un usuario y devolver un token', async () => {
			const testUser = await User.create({
				email: 'fabiliria@gmail.com',
				password: 'ValidPass123',
				name: 'Test',
				last_name: 'User',
				role: 'Administrador',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				phone: '0987654321',
				status: 'Activo',
			});

			const req = {
				body: {
					email: 'fabiliria@gmail.com',
					password: 'ValidPass123',
				},
			};

			const res = {
				json: jest.fn(),
			};

			const next = jest.fn();

			await authController.login(req, res, next);

			expect(res.json).toHaveBeenCalled();
			const response = res.json.mock.calls[0][0];
			expect(response).toHaveProperty('token');
			expect(response).toHaveProperty('user');
			expect(response.user).toHaveProperty('email', 'fabiliria@gmail.com');
			expect(response.user).toHaveProperty('role', 'Administrador');
			expect(next).not.toHaveBeenCalled();
		});

		it('debería rechazar el login con email inválido', async () => {
			const req = {
				body: {
					email: 'invalidemail',
					password: 'ValidPass123',
				},
			};

			const res = {};
			const next = jest.fn();

			await authController.login(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(next.mock.calls[0][0].statusCode).toBe(406);
			expect(next.mock.calls[0][0].message).toBe(
				'El correo electrónico ingresado no es válido',
			);
		});

		it('debería rechazar el login para usuario inactivo', async () => {
			await User.create({
				email: 'inactive@example.com',
				password: 'ValidPass123',
				name: 'Inactive',
				last_name: 'User',
				role: 'Administrador',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				phone: '0987654321',
				status: 'Inactivo',
			});

			const req = {
				body: {
					email: 'inactive@example.com',
					password: 'ValidPass123',
				},
			};

			const res = {};
			const next = jest.fn();

			await authController.login(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(next.mock.calls[0][0].statusCode).toBe(403);
			expect(next.mock.calls[0][0].message).toBe(
				'El usuario está desactivado y no puede acceder al sistema',
			);
		});

		it('debería rechazar el login con contraseña incorrecta', async () => {
			await User.create({
				email: 'test@example.com',
				password: 'ValidPass123',
				name: 'Test',
				last_name: 'User',
				role: 'Administrador',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				phone: '0987654321',
				status: 'Activo',
			});

			const req = {
				body: {
					email: 'test@example.com',
					password: 'WrongPass123',
				},
			};

			const res = {};
			const next = jest.fn();

			await authController.login(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(next.mock.calls[0][0].statusCode).toBe(401);
			expect(next.mock.calls[0][0].message).toBe('Contraseña incorrecta');
		});

		it('debería rechazar el login con usuario no encontrado', async () => {
			const req = {
				body: {
					email: 'nonexistent@example.com',
					password: 'ValidPass123',
				},
			};

			const res = {};
			const next = jest.fn();

			await authController.login(req, res, next);

			expect(next).toHaveBeenCalled();
			expect(next.mock.calls[0][0].statusCode).toBe(404);
			expect(next.mock.calls[0][0].message).toBe(
				'El correo electrónico ingresado no esta registrado en el sistema',
			);
		});
	});
});
