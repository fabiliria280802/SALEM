const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../../index');
const Invoice = require('../../models/Invoice');
const User = require('../../models/User');
const path = require('path');

describe('Invoice Routes', () => {
    let mongoServer;
    let token;
    let testUser;
    let testInvoice;

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

        testInvoice = await Invoice.create({
            invoice_number: 'invoice-001',
            issuing_company: 'Test Company',
            receiving_company: 'ENAP SIPETROL S.A.',
            service: 'Test Service',
            created_by: testUser._id,
            file_path: 'data/docs/test-invoice.pdf'
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('POST /api/invoice', () => {
        it('debería crear una nueva factura', async () => {
            const filePath = path.join(__dirname, '../../../data/practice/invoice-001.pdf');
            
            const response = await request(app)
                .post('/api/invoice')
                .set('Authorization', `Bearer ${token}`)
                .field('documentType', 'Invoice')
                .field('ruc', testUser.ruc)
                .field('contract', 'contract-001')
                .attach('file', filePath);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
        });

        it('debería validar los cálculos financieros', async () => {
            const response = await request(app)
                .post('/api/invoice')
                .set('Authorization', `Bearer ${token}`)
                .field('documentType', 'Invoice')
                .field('ruc', testUser.ruc)
                .field('contract', 'contract-001')
                .attach('file', path.join(__dirname, '../../../data/practice/invoice-002-error.pdf'));

            expect(response.status).toBe(400);
            expect(response.body.validation_errors).toContain('Error en cálculos financieros');
        });
    });

    describe('GET /api/invoice', () => {
        it('debería obtener todas las facturas', async () => {
            const response = await request(app)
                .get('/api/invoice')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
        });
    });

    describe('GET /api/invoice/:id', () => {
        it('debería obtener una factura por ID', async () => {
            const response = await request(app)
                .get(`/api/invoice/${testInvoice._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.invoice_number).toBe(testInvoice.invoice_number);
        });
    });

    describe('GET /api/invoice/number/:invoice_number', () => {
        it('debería obtener una factura por número', async () => {
            const response = await request(app)
                .get('/api/invoice/number/invoice-001')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.invoice_number).toBe('invoice-001');
        });
    });

    describe('PUT /api/invoice/:id', () => {
        it('debería actualizar una factura', async () => {
            const response = await request(app)
                .put(`/api/invoice/${testInvoice._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    service: 'Updated Service'
                });

            expect(response.status).toBe(200);
            expect(response.body.service).toBe('Updated Service');
        });
    });
}); 