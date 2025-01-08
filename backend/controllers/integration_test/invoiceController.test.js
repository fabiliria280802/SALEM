const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const invoiceController = require('../invoiceController');

describe('InvoiceController Integration Tests', () => {
	let mongoServer;
	let testUser;
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
			await Invoice.deleteMany({});
			await User.deleteMany({});

			// Crear usuario proveedor de prueba
			testUser = await User.create({
				name: 'Test',
				last_name: 'Provider',
				email: 'provider@test.com',
				password: 'ValidPass123',
				phone: '0987654321',
				company_name: 'Empresa Ejemplo',
				ruc: '1757797202001',
				role: 'Proveedor',
				status: 'Activo',
			});

			// Crear usuario administrador
			adminUser = await User.create({
				name: 'Admin',
				last_name: 'Test',
				email: 'admin@test.com',
				password: 'ValidPass123',
				phone: '0987654322',
				company_name: 'Empresa Admin',
				ruc: '1757797202001',
				role: 'Administrador',
				status: 'Activo',
			});
		} catch (error) {
			console.error('Error en beforeEach:', error);
			throw error;
		}
	});

	describe('createInvoice', () => {
		it('debería crear una factura exitosamente', async () => {
			const req = {
				body: {
					invoiceNumber: 'FAC-001',
					amount: 1000.5,
					emissionDate: new Date(),
					provider: testUser._id,
					status: 'Pendiente',
					file_path: '/path/to/invoice.pdf',
				},
				user: testUser,
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			const createInvoiceMiddleware =
				invoiceController.create[invoiceController.create.length - 1];
			await createInvoiceMiddleware(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Factura creada exitosamente',
					invoice: expect.objectContaining({
						invoiceNumber: 'FAC-001',
						amount: 1000.5,
						provider: testUser._id.toString(),
						file_path: '/path/to/invoice.pdf',
						created_by: testUser._id,
					}),
				}),
			);
		});

		it('debería rechazar factura con datos inválidos', async () => {
			const req = {
				body: {
					invoiceNumber: '', // Número inválido
					amount: -100, // Monto inválido
					provider: testUser._id,
					file_path: '/path/to/invoice.pdf',
					created_by: testUser._id,
				},
				user: testUser,
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await invoiceController.createInvoice(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json.mock.calls[0][0]).toHaveProperty('errors');
		});
	});

	describe('getInvoices', () => {
		it('debería obtener todas las facturas para un administrador', async () => {
			// Crear algunas facturas de prueba
			await Invoice.create([
				{
					invoiceNumber: 'FAC-001',
					amount: 1000.5,
					emissionDate: new Date(),
					provider: testUser._id,
					status: 'Pendiente',
					file_path: '/path/to/invoice1.pdf',
					created_by: adminUser._id,
				},
				{
					invoiceNumber: 'FAC-002',
					amount: 2000.75,
					emissionDate: new Date(),
					provider: testUser._id,
					status: 'Aceptado',
					file_path: '/path/to/invoice2.pdf',
					created_by: adminUser._id,
				},
			]);

			const req = {
				user: adminUser,
			};

			const res = {
				json: jest.fn(),
			};

			await invoiceController.getInvoices(req, res);

			expect(res.json).toHaveBeenCalled();
			const invoices = res.json.mock.calls[0][0];
			expect(Array.isArray(invoices)).toBeTruthy();
			expect(invoices.length).toBe(2);
		});

		it('debería obtener solo las facturas del proveedor', async () => {
			// Crear facturas de diferentes proveedores
			await Invoice.create([
				{
					invoiceNumber: 'FAC-001',
					amount: 1000.5,
					emissionDate: new Date(),
					provider: testUser._id,
					status: 'Pendiente',
					file_path: '/path/to/invoice1.pdf',
					created_by: testUser._id,
				},
				{
					invoiceNumber: 'FAC-002',
					amount: 2000.75,
					emissionDate: new Date(),
					provider: adminUser._id,
					status: 'Pendiente',
					file_path: '/path/to/invoice2.pdf',
					created_by: adminUser._id,
				},
			]);

			const req = {
				user: testUser,
			};

			const res = {
				json: jest.fn(),
			};

			await invoiceController.getInvoices(req, res);

			expect(res.json).toHaveBeenCalled();
			const invoices = res.json.mock.calls[0][0];
			expect(Array.isArray(invoices)).toBeTruthy();
			expect(invoices.length).toBe(1);
			expect(invoices[0].provider.toString()).toBe(testUser._id.toString());
		});
	});

	describe('updateInvoiceStatus', () => {
		it('debería actualizar el estado de una factura', async () => {
			const invoice = await Invoice.create({
				invoiceNumber: 'FAC-001',
				amount: 1000.5,
				emissionDate: new Date(),
				provider: testUser._id,
				status: 'Pendiente',
				file_path: '/path/to/invoice.pdf',
				created_by: `${testUser.name} ${testUser.last_name}`,
			});

			const req = {
				params: { id: invoice._id },
				body: { status: 'Aceptado' },
				user: adminUser,
			};

			const res = {
				json: jest.fn(),
			};

			await invoiceController.updateInvoiceStatus(req, res);

			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Estado de factura actualizado exitosamente',
					invoice: expect.objectContaining({
						status: 'Aceptado',
					}),
				}),
			);

			const updatedInvoice = await Invoice.findById(invoice._id);
			expect(updatedInvoice.status).toBe('Aceptado');
		});
	});
});
