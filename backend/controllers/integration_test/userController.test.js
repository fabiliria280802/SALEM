const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../models/User');
const userController = require('../userController');
const { sendPasswordCreationEmail } = require('../notificationController');

// Mock del módulo de notificaciones
jest.mock('../notificationController', () => ({
	sendPasswordCreationEmail: jest.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('UserController Integration Tests', () => {
	let mongoServer;
	let adminUser;

	// Aumentar el timeout para la configuración inicial
	jest.setTimeout(30000);

	beforeAll(async () => {
		try {
			mongoServer = await MongoMemoryServer.create();
			const mongoUri = mongoServer.getUri();
			await mongoose.connect(mongoUri, {
				useNewUrlParser: true,
				useUnifiedTopology: true,
			});
		} catch (error) {
			console.error('Error en beforeAll:', error);
			throw error;
		}
	});

	afterAll(async () => {
		try {
			await mongoose.disconnect();
			if (mongoServer) {
				await mongoServer.stop();
			}
		} catch (error) {
			console.error('Error en afterAll:', error);
		}
	});

	beforeEach(async () => {
		try {
			await User.deleteMany({});

			// Crear usuario administrador
			adminUser = await User.create({
				name: 'Admin',
				last_name: 'Test',
				email: 'admin@test.com',
				password: 'ValidPass123',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				role: 'Administrador',
				status: 'Activo',
			});
		} catch (error) {
			console.error('Error en beforeEach:', error);
			throw error;
		}
	});

	describe('createUser', () => {
		// Aumentar timeout para tests individuales si es necesario
		jest.setTimeout(10000);

		it('debería crear un nuevo usuario exitosamente', async () => {
			const req = {
				body: {
					name: 'Test',
					last_name: 'User',
					phone: '0987654321',
					company_name: 'Empresa Ejemplo',
					ruc: '1757797202001',
					email: 'test@example.com',
					role: 'Proveedor',
				},
				user: {
					name: adminUser.name,
					last_name: adminUser.last_name,
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const next = jest.fn();

			await userController.createUser[2](req, res, next);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.any(String),
					user: expect.objectContaining({
						email: 'test@example.com',
						role: 'Proveedor',
					}),
				}),
			);
			expect(sendPasswordCreationEmail).toHaveBeenCalled();
		});

		it('debería rechazar la creación con datos inválidos', async () => {
			const req = {
				body: {
					name: 'Test123', // Nombre inválido con números
					last_name: 'User',
					phone: '123', // Teléfono inválido
					company_name: 'Empresa123', // Nombre de empresa inválido
					ruc: '123456789', // RUC inválido
					email: 'invalid-email',
					role: 'Proveedor',
				},
				user: {
					name: adminUser.name,
					last_name: adminUser.last_name,
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const next = jest.fn();

			await userController.createUser[2](req, res, next);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json.mock.calls[0][0]).toHaveProperty('errors');
		});
	});

	describe('getAllUsers', () => {
		jest.setTimeout(10000);

		it('debería obtener todos los usuarios', async () => {
			// Crear usuarios de prueba con datos válidos
			await User.create([
				{
					name: 'Prueba',
					last_name: 'Usuario',
					phone: '0987654321',
					company_name: 'Empresa Primera',
					ruc: '1757797202001',
					email: 'prueba@example.com',
					role: 'Proveedor',
					status: 'Activo',
					password: 'ValidPass123',
				},
				{
					name: 'Segundo',
					last_name: 'Prueba',
					phone: '0987654322',
					company_name: 'Empresa Segunda',
					ruc: '1757797202001',
					email: 'segundo@example.com',
					role: 'Proveedor',
					status: 'Activo',
					password: 'ValidPass123',
				},
			]);

			const req = {
				user: {
					role: 'Administrador',
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const next = jest.fn();

			// Llamar al último middleware del array
			const getAllUsersMiddleware =
				userController.getAllUsers[userController.getAllUsers.length - 1];
			await getAllUsersMiddleware(req, res, next);

			// Verificar que res.json fue llamado
			expect(res.json).toHaveBeenCalled();

			// Obtener los usuarios de la respuesta
			const responseData = res.json.mock.calls[0][0];

			// Verificar que responseData es un array
			expect(Array.isArray(responseData)).toBeTruthy();
			expect(responseData.length).toBeGreaterThan(0);

			// Verificar que cada usuario tiene los campos esperados y no tiene password
			responseData.forEach(user => {
				expect(user).toBeDefined();
				expect(user).toEqual(
					expect.objectContaining({
						name: expect.any(String),
						email: expect.any(String),
						role: expect.any(String),
					}),
				);
				// Verificar que el password no está incluido en la respuesta
				expect(Object.keys(user)).not.toContain('password');
			});
		});

		it('debería rechazar si no es administrador', async () => {
			const req = {
				user: {
					role: 'Proveedor',
				},
			};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};
			const next = jest.fn();

			await userController.getAllUsers[1](req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalledWith({
				message: 'No autorizado, debes ser Administrador',
			});
		});
	});

	describe('updateUser', () => {
		jest.setTimeout(10000);

		it('debería actualizar un usuario exitosamente', async () => {
			const testUser = await User.create({
				name: 'Test',
				last_name: 'User',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				email: 'test@example.com',
				role: 'Proveedor',
				status: 'Activo',
			});

			const req = {
				params: { id: testUser._id },
				body: {
					phone: '0987654322',
					company_name: 'Nueva Empresa',
				},
			};

			const res = {
				json: jest.fn(),
			};

			const next = jest.fn();

			await userController.updateUser[2](req, res, next);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Usuario actualizado exitosamente',
					user: expect.objectContaining({
						phone: '0987654322',
						company_name: 'Nueva Empresa',
					}),
				}),
			);
		});
	});

	describe('suspendUser', () => {
		jest.setTimeout(10000);

		it('debería suspender un usuario exitosamente', async () => {
			const testUser = await User.create({
				name: 'Test',
				last_name: 'User',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				email: 'test@example.com',
				role: 'Proveedor',
				status: 'Activo',
			});

			const req = {
				params: { id: testUser._id },
			};

			const res = {
				json: jest.fn(),
			};

			const next = jest.fn();

			await userController.suspendUser[2](req, res, next);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Usuario desactivado exitosamente',
			});

			const updatedUser = await User.findById(testUser._id);
			expect(updatedUser.status).toBe('Inactivo');
		});
	});

	describe('verifyResetCode', () => {
		jest.setTimeout(10000);

		it('debería verificar el código de reset correctamente', async () => {
			const testUser = await User.create({
				name: 'Test',
				last_name: 'User',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				email: 'test@example.com',
				role: 'Proveedor',
				resetCode: '123456',
			});

			const req = {
				body: {
					email: 'test@example.com',
					code: '123456',
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await userController.verifyResetCode(req, res);

			// Verificar el status
			expect(res.status).toHaveBeenCalledWith(200);

			// Obtener la respuesta actual
			const actualResponse = res.json.mock.calls[0][0];

			// Verificar la estructura y el mensaje
			expect(actualResponse).toHaveProperty(
				'message',
				'Código verificado correctamente',
			);
			expect(actualResponse).toHaveProperty('userId');

			// Convertir el ObjectId a string si es necesario
			const userId =
				actualResponse.userId instanceof mongoose.Types.ObjectId
					? actualResponse.userId.toString()
					: actualResponse.userId;

			// Verificar que el userId es válido
			expect(mongoose.Types.ObjectId.isValid(userId)).toBeTruthy();

			// Verificar que el userId corresponde al usuario de prueba
			expect(userId).toBe(testUser._id.toString());
		});

		it('debería rechazar código inválido', async () => {
			const testUser = await User.create({
				name: 'Test',
				last_name: 'User',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				email: 'test@example.com',
				role: 'Proveedor',
				resetCode: '123456',
			});

			const req = {
				body: {
					email: 'test@example.com',
					code: '999999', // código incorrecto
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await userController.verifyResetCode(req, res);

			expect(res.status).toHaveBeenCalledWith(404);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Código incorrecto o no encontrado',
			});
		});
	});
});
