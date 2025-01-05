const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const ServiceDeliveryRecord = require('../../models/ServiceDeliveryRecord');
const User = require('../../models/User');
const path = require('path');

describe('Service Delivery Record Routes', () => {
    let mongoServer;
    let token;
    let testUser;
    let testRecord;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());

        testUser = await User.create({
            name: 'Test',
            last_name: 'User',
            email: 'test@example.com',
            password: 'password123',
            role: 'Proveedor',
            ruc: '1234567890001'
        });

        token = jwt.sign(
            { id: testUser._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        testRecord = await ServiceDeliveryRecord.create({
            hes_number: 'record-001',
            receiving_company: 'ENAP SIPETROL S.A.',
            service: 'Test Service',
            created_by: testUser._id,
            file_path: 'data/docs/test-record.pdf'
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('POST /api/service-record', () => {
        it('debería crear un nuevo registro de servicio', async () => {
            const filePath = path.join(__dirname, '../../../data/practice/record-001.pdf');
            
            const response = await request(app)
                .post('/api/service-record')
                .set('Authorization', `Bearer ${token}`)
                .field('documentType', 'ServiceDeliveryRecord')
                .field('ruc', testUser.ruc)
                .field('contract', 'contract-001')
                .attach('file', filePath);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
        });

        it('debería validar el contrato relacionado', async () => {
            const response = await request(app)
                .post('/api/service-record')
                .set('Authorization', `Bearer ${token}`)
                .field('documentType', 'ServiceDeliveryRecord')
                .field('ruc', testUser.ruc)
                .field('contract', 'invalid-contract')
                .attach('file', path.join(__dirname, '../../../data/practice/record-002.pdf'));

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Contrato no encontrado');
        });
    });

    describe('GET /api/service-record', () => {
        it('debería obtener todos los registros', async () => {
            const response = await request(app)
                .get('/api/service-record')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('GET /api/service-record/:id', () => {
        it('debería obtener un registro por ID', async () => {
            const response = await request(app)
                .get(`/api/service-record/${testRecord._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.hes_number).toBe(testRecord.hes_number);
        });
    });

    describe('PUT /api/service-record/:id', () => {
        it('debería actualizar un registro', async () => {
            const response = await request(app)
                .put(`/api/service-record/${testRecord._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    service: 'Updated Service'
                });

            expect(response.status).toBe(200);
            expect(response.body.service).toBe('Updated Service');
        });
    });
}); 