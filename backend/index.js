const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const invoiceRoutes = require('./routes/invoice');
const contractRoutes = require('./routes/contract');
const serviceDeliveryRecordRoutes = require('./routes/serviceDeliveryRecord');
const documentRoutes = require('./routes/documents');
const iaMetricsRoutes = require('./routes/ia_metrics');
const createPasswordRoutes = require('./routes/create-password');
const mailRoutes = require('./routes/mail');
<<<<<<< Updated upstream
const trainRoutes = require('./routes/train');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
=======
>>>>>>> Stashed changes
const userPublicRoutes = require('./routes/userPublicRoutes');

// Importar middlewares
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();

<<<<<<< Updated upstream
app.use(cors());
=======
app.use(cors({ origin: '*' }));
>>>>>>> Stashed changes
app.use(express.json());
app.use(bodyParser.json());

// Crear estructura de directorios necesaria
const dataDir = path.join(process.cwd(), 'data');
const docsDir = path.join(dataDir, 'docs');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
}

// Endpoint de prueba
app.get('/', (req, res) => {
    res.send('API is running');
});

// Rutas de autenticación y usuarios
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/new-user', createPasswordRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/public', userPublicRoutes);
<<<<<<< Updated upstream
router.post('/api/train', trainRoutes);
app.use('/api/documents/Invoice', authMiddleware, invoiceRoutes);
app.use('/api/documents/Contract', authMiddleware, contractRoutes);
app.use('/api/documents/Service-record', authMiddleware, serviceDeliveryRecordRoutes);
=======

// Rutas de documentos
app.use('/api/documents/invoice', authMiddleware, invoiceRoutes);
app.use('/api/documents/contract', authMiddleware, contractRoutes);
app.use('/api/documents/service-delivery-record', authMiddleware, serviceDeliveryRecordRoutes);
>>>>>>> Stashed changes
app.use('/api/documents', authMiddleware, documentRoutes);

// Rutas de reportes
app.use('/api/report/contracts', authMiddleware, contractRoutes);
app.use('/api/report/invoices', authMiddleware, invoiceRoutes);
app.use('/api/report/service-records', authMiddleware, serviceDeliveryRecordRoutes);
app.use('/api/report/ia-metrics', authMiddleware, iaMetricsRoutes);
<<<<<<< Updated upstream
=======

// Rutas estáticas
app.use('/data/docs', express.static(path.join(__dirname, 'data/docs')));
>>>>>>> Stashed changes

// Middleware para manejo de errores
app.use(errorMiddleware);

// Inicializar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
