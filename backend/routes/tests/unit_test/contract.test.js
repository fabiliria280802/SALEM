const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const Contract = require('../../models/Contract');
const User = require('../../models/User');
const path = require('path');
const fs = require('fs');

describe('Contract Routes', () => {
	let mongoServer;
	let token;
	let testUser;
	let testContract;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());

		// Crear usuario de prueba
		testUser = await User.create({
			name: 'Test',
			last_name: 'User',
			email: 'test@example.com',
			password: 'password123',
			role: 'Proveedor',
			ruc: '1234567890001',
		});

		// Generar token
		token = jwt.sign(
			{ id: testUser._id },
			process.env.JWT_SECRET || 'your-secret-key',
			{ expiresIn: '1h' },
		);

		// Crear contrato de prueba
		testContract = await Contract.create({
			contract_number: 'contract-001',
			contracting_company: 'ENAP SIPETROL S.A.',
			contracted_company: 'Test Company',
			service: 'Test Service',
			created_by: testUser._id,
			file_path: 'data/docs/test-contract.pdf',
		});
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	describe('POST /api/contract', () => {
		it('debería crear un nuevo contrato', async () => {
			const filePath = path.join(
				__dirname,
				'../../../data/practice/contract-001.pdf',
			);

			const response = await request(app)
				.post('/api/contract')
				.set('Authorization', `Bearer ${token}`)
				.field('documentType', 'Contract')
				.field('ruc', testUser.ruc)
				.field('contract', 'contract-002')
				.attach('file', filePath);

			expect(response.status).toBe(201);
			expect(response.body).toHaveProperty('_id');
			expect(response.body.message).toBe('Contrato procesado correctamente');
		});

		it('debería fallar si falta el archivo', async () => {
			const response = await request(app)
				.post('/api/contract')
				.set('Authorization', `Bearer ${token}`)
				.field('documentType', 'Contract')
				.field('ruc', testUser.ruc)
				.field('contract', 'contract-003');

			expect(response.status).toBe(400);
			expect(response.body.error).toBe('No se ha proporcionado un archivo');
		});
	});

	describe('GET /api/contract/:id', () => {
		it('debería obtener un contrato por ID', async () => {
			const response = await request(app)
				.get(`/api/contract/${testContract._id}`)
				.set('Authorization', `Bearer ${token}`);

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty(
				'contract_number',
				testContract.contract_number,
			);
		});

		it('debería fallar con ID inválido', async () => {
			const response = await request(app)
				.get('/api/contract/invalid-id')
				.set('Authorization', `Bearer ${token}`);

			expect(response.status).toBe(404);
		});
	});

	describe('PUT /api/contract/:id', () => {
		it('debería actualizar un contrato', async () => {
			const response = await request(app)
				.put(`/api/contract/${testContract._id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({
					service: 'Updated Service',
				});

			expect(response.status).toBe(200);
			expect(response.body.service).toBe('Updated Service');
		});
	});

	describe('DELETE /api/contract/:id', () => {
		it('debería eliminar un contrato', async () => {
			const response = await request(app)
				.delete(`/api/contract/${testContract._id}`)
				.set('Authorization', `Bearer ${token}`);

			expect(response.status).toBe(200);
			expect(response.body.message).toBe('Contrato eliminado exitosamente');
		});
	});
});
