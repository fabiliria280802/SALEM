const express = require('express');
const bodyParser = require('body-parser');
//const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const invoiceRoutes = require('./routes/invoice');
const contractRoutes = require('./routes/contract');
const serviceDeliveryRecordRoutes = require('./routes/serviceDeliveryRecord');
const documentRoutes = require('./routes/documents');
const iaMetricsRoutes = require('./routes/ia_metrics');
const createPasswordRoutes = require('./routes/create-password');
const mailRoutes = require('./routes/mail');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const userPublicRoutes = require('./routes/userPublicRoutes');

const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
    origin: '*', // Permite todas las solicitudes (puedes restringirlo según sea necesario)
}));
app.use(express.json());

// Crear estructura de directorios necesaria
const dataDir = path.join(process.cwd(), 'data');
const docsDir = path.join(dataDir, 'docs');

if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir);
}
if (!fs.existsSync(docsDir)) {
	fs.mkdirSync(docsDir);
}

app.get('/', (req, res) => {
	res.send('API for');
});

//app.use(helmet());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/new-user', createPasswordRoutes);
app.use('/api/mail', mailRoutes);

app.use('/api/public', userPublicRoutes);

app.use('/api/documents/Invoice', authMiddleware, invoiceRoutes);
app.use('/api/documents/Contract', authMiddleware, contractRoutes);
app.use(
	'/api/documents/ServiceDeliveryRecord',
	authMiddleware,
	serviceDeliveryRecordRoutes,
);
app.use('/api/documents', authMiddleware, documentRoutes);

app.use('/api/report/ia-metrics', authMiddleware, iaMetricsRoutes);
app.use('/data/docs', express.static(path.join(__dirname, 'data/docs')));

app.use(errorMiddleware);

module.exports = app;