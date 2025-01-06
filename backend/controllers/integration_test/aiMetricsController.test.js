const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AiMetrics = require('../../models/AI_metrics');
const Invoice = require('../../models/Invoice');
const Document = require('../../models/Document');
const ServiceDeliveryRecord = require('../../models/ServiceDeliveryRecord');
const aiMetricsController = require('../../controllers/aiMetricsController');

describe('AiMetricsController Integration Tests', () => {
	let mongoServer;
	let testDocument;
	let testServiceDeliveryRecord;

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
			await AiMetrics.deleteMany({});
			await Document.deleteMany({});
			await ServiceDeliveryRecord.deleteMany({});

			// Crear ServiceDeliveryRecord de prueba
			testServiceDeliveryRecord = await ServiceDeliveryRecord.create({
				// Agregar los campos necesarios del ServiceDeliveryRecord
			});

			// Crear documento de prueba
			testDocument = await Document.create({
				service_delivery_record_id: testServiceDeliveryRecord._id,
				number: 'DOC-001',
				register_date: new Date(),
				type: 'HES',
			});
		} catch (error) {
			console.error('Error en beforeEach:', error);
			throw error;
		}
	});

	describe('createAiMetrics', () => {
		it('debería crear métricas AI exitosamente', async () => {
			const req = {
				body: {
					documentID: testDocument._id,
					ai_accuracy: 0.95,
					ai_confidence_score: 0.87,
					false_positives: 2,
					false_negatives: 1,
					true_positives: 45,
					true_negatives: 15,
					execution_time: 1.5,
					field_errors: new Map([
						['ruc', 1],
						['fecha', 0],
					]),
					batch_id: 'BATCH-001',
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await aiMetricsController.createAiMetrics(req, res);

			expect(res.status).toHaveBeenCalledWith(201);
			const savedMetrics = await AiMetrics.findOne({
				documentID: testDocument._id,
			});
			expect(savedMetrics).toBeDefined();
			expect(savedMetrics.ai_accuracy).toBe(0.95);
		});

		it('debería rechazar métricas con datos inválidos', async () => {
			const req = {
				body: {
					documentID: testDocument._id,
					// Faltan campos requeridos
				},
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await aiMetricsController.createAiMetrics(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				error: 'Error al crear las métricas AI',
			});
		});
	});

	describe('getAllAiMetrics', () => {
		it('debería obtener todas las métricas AI', async () => {
			// Crear métricas de prueba
			await AiMetrics.create([
				{
					documentID: testDocument._id,
					ai_accuracy: 0.95,
					ai_confidence_score: 0.87,
					false_positives: 2,
					false_negatives: 1,
					true_positives: 45,
					true_negatives: 15,
					execution_time: 1.5,
					field_errors: new Map([['ruc', 1]]),
					batch_id: 'BATCH-001',
				},
				{
					documentID: testDocument._id,
					ai_accuracy: 0.92,
					ai_confidence_score: 0.85,
					false_positives: 3,
					false_negatives: 2,
					true_positives: 40,
					true_negatives: 12,
					execution_time: 1.8,
					field_errors: new Map([['fecha', 1]]),
					batch_id: 'BATCH-002',
				},
			]);

			const req = {};
			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await aiMetricsController.getAllAiMetrics(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			const metrics = res.json.mock.calls[0][0];
			expect(Array.isArray(metrics)).toBeTruthy();
			expect(metrics.length).toBe(2);
		});
	});

	describe('getAiMetricsById', () => {
		it('debería obtener métricas AI por ID', async () => {
			const metrics = await AiMetrics.create({
				documentID: testDocument._id,
				ai_accuracy: 0.95,
				ai_confidence_score: 0.87,
				false_positives: 2,
				false_negatives: 1,
				true_positives: 45,
				true_negatives: 15,
				execution_time: 1.5,
				field_errors: new Map([['ruc', 1]]),
				batch_id: 'BATCH-001',
			});

			const req = {
				params: { id: metrics._id },
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await aiMetricsController.getAiMetricsById(req, res);

			expect(res.status).toHaveBeenCalledWith(200);
			const returnedMetrics = res.json.mock.calls[0][0];
			expect(returnedMetrics.documentID.toString()).toBe(
				testDocument._id.toString(),
			);
			expect(returnedMetrics.ai_accuracy).toBe(0.95);
		});

		it('debería manejar ID inválido', async () => {
			const req = {
				params: { id: 'invalid-id' },
			};

			const res = {
				status: jest.fn().mockReturnThis(),
				json: jest.fn(),
			};

			await aiMetricsController.getAiMetricsById(req, res);

			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith({
				error: 'ID de métricas AI inválido',
			});
		});
	});
});
