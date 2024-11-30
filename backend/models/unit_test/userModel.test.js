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

	afterEach(async () => {
		await User.deleteMany();
	});

	const validUserData = {
		name: 'Carlos',
		last_name: 'Perez',
		phone: '0987654321',
		company_name: 'Empresa Ejemplo',
		ruc: '1757797202001',
		email: 'carlos@example.com',
		password: 'securepassword',
		role: 'Administrador',
	};

	describe('Validaciones de campos obligatorios', () => {
		it('debería crear y guardar un usuario exitosamente', async () => {
			const validUser = new User(validUserData);
			const savedUser = await validUser.save();

			expect(savedUser._id).toBeDefined();
			expect(savedUser.name).toBe(validUserData.name);
			expect(savedUser.status).toBe('Activo');
			expect(savedUser.created_by).toBe('System');
			expect(savedUser.register_date).toBeDefined();
		});

		it('debería fallar al guardar un usuario sin campos requeridos', async () => {
			const userWithoutRequiredField = new User({});
			let err;

			try {
				await userWithoutRequiredField.save();
			} catch (error) {
				err = error;
			}

			expect(err).toBeDefined();
			expect(err.errors.name).toBeDefined();
			expect(err.errors.last_name).toBeDefined();
			expect(err.errors.phone).toBeDefined();
			expect(err.errors.company_name).toBeDefined();
			expect(err.errors.ruc).toBeDefined();
			expect(err.errors.email).toBeDefined();
		});
	});

	describe('Validaciones de formato', () => {
		it('debería fallar con un nombre que contiene números', async () => {
			const userWithInvalidName = new User({
				...validUserData,
				name: 'Carlos123'
			});

			let err;
			try {
				await userWithInvalidName.save();
			} catch (error) {
				err = error;
			}

			expect(err).toBeDefined();
			expect(err.errors.name.message).toBe('El nombre solo debe contener letras y espacios.');
		});

		it('debería fallar con un número de teléfono inválido', async () => {
			const userWithInvalidPhone = new User({
				...validUserData,
				phone: '123'
			});

			let err;
			try {
				await userWithInvalidPhone.save();
			} catch (error) {
				err = error;
			}

			expect(err).toBeDefined();
			expect(err.errors.phone.message).toBe('El número de teléfono debe tener exactamente 10 dígitos.');
		});

		it('debería fallar con un nombre de empresa que contiene caracteres especiales', async () => {
			const userWithInvalidCompany = new User({
				...validUserData,
				company_name: 'Empresa@123'
			});

			let err;
			try {
				await userWithInvalidCompany.save();
			} catch (error) {
				err = error;
			}

			expect(err).toBeDefined();
			expect(err.errors.company_name.message).toBe('El nombre de la empresa no puede contener caracteres especiales ni números.');
		});
	});

	describe('Validaciones de seguridad', () => {
		it('debería hashear la contraseña antes de guardar', async () => {
			const user = new User(validUserData);
			await user.save();

			const isPasswordHashed = await bcrypt.compare(
				validUserData.password,
				user.password
			);
			expect(isPasswordHashed).toBe(true);
			expect(user.password).not.toBe(validUserData.password);
		});

		it('no debería modificar la contraseña si no ha cambiado', async () => {
			const user = new User(validUserData);
			await user.save();
			const originalPassword = user.password;

			user.name = 'Nuevo Nombre';
			await user.save();

			expect(user.password).toBe(originalPassword);
		});
	});

	describe('Validaciones de rol y estado', () => {
		it('debería asignar rol Proveedor por defecto', async () => {
			const userWithoutRole = new User({
				...validUserData,
				role: undefined
			});
			await userWithoutRole.save();

			expect(userWithoutRole.role).toBe('Proveedor');
		});

		it('debería fallar con un rol inválido', async () => {
			const userWithInvalidRole = new User({
				...validUserData,
				role: 'RolInvalido'
			});

			let err;
			try {
				await userWithInvalidRole.save();
			} catch (error) {
				err = error;
			}

			expect(err).toBeDefined();
			expect(err.errors.role).toBeDefined();
		});

		it('debería asignar estado Activo por defecto', async () => {
			const user = new User(validUserData);
			await user.save();

			expect(user.status).toBe('Activo');
		});
	});
});
