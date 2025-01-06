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
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
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

app.use('/api/invoice', authMiddleware, invoiceRoutes);
app.use('/api/contract', authMiddleware, contractRoutes);
app.use('/api/service-record', authMiddleware, serviceDeliveryRecordRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);

app.use('/api/report/ia-metrics', authMiddleware, iaMetricsRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
