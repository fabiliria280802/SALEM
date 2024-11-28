const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../User');
const bcrypt = require('bcryptjs');

describe('User Model Test Suite', () => {
	let mongoServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri(), {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
	});

	afterAll(async () => {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
		await mongoServer.stop();
	});

	it('should create and save a user successfully', async () => {
		const userData = {
			name: 'Carlos',
			last_name: 'Perez',
			phone: '0987654321',
			company_name: 'Empresa Ejemplo',
			ruc: '1234567890001',
			email: 'carlos@example.com',
			password: 'securepassword',
			role: 'Administrador',
		};

		const validUser = new User(userData);
		const savedUser = await validUser.save();

		expect(savedUser._id).toBeDefined();
		expect(savedUser.name).toBe(userData.name);
		expect(savedUser.last_name).toBe(userData.last_name);
		expect(savedUser.phone).toBe(userData.phone);
		expect(savedUser.company_name).toBe(userData.company_name);
		expect(savedUser.ruc).toBe(userData.ruc);
		expect(savedUser.email).toBe(userData.email);
		expect(savedUser.role).toBe(userData.role);
	});

	it('should not save user with invalid RUC', async () => {
		const userData = {
			name: 'Carlos',
			last_name: 'Perez',
			phone: '0987654321',
			company_name: 'Empresa Ejemplo',
			ruc: 'invalidRUC',
			email: 'carlos@example.com',
			password: 'securepassword',
		};

		const invalidUser = new User(userData);
		let err;
		try {
			await invalidUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeDefined();
		expect(err.errors.ruc).toBeDefined();
		expect(err.errors.ruc.message).toBe('El RUC ingresado no es válido.');
	});

	it('should hash the password before saving', async () => {
		const userData = {
			name: 'Carlos',
			last_name: 'Perez',
			phone: '0987654321',
			company_name: 'Empresa Ejemplo',
			ruc: '1234567890001',
			email: 'carlos@example.com',
			password: 'securepassword',
		};

		const user = new User(userData);
		await user.save();

		const isPasswordHashed = await bcrypt.compare(
			'securepassword',
			user.password,
		);
		expect(isPasswordHashed).toBe(true);
	});

	it('should not save user with invalid email format', async () => {
		const userData = {
			name: 'Carlos',
			last_name: 'Perez',
			phone: '0987654321',
			company_name: 'Empresa Ejemplo',
			ruc: '1234567890001',
			email: 'invalid-email-format',
			password: 'securepassword',
		};

		const invalidUser = new User(userData);
		let err;
		try {
			await invalidUser.save();
		} catch (error) {
			err = error;
		}
		expect(err).toBeDefined();
		expect(err.errors.email).toBeDefined();
		expect(err.errors.email.message).toBe(
			'El correo electrónico ingresado no es válido.',
		);
	});
});
