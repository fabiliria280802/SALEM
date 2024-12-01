const express = require('express');
const bodyParser = require('body-parser');
//const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const invoiceRoutes = require('./routes/invoice');
const iaMetricsRoutes = require('./routes/ia_metrics');
const reportRoutes = require('./routes/report');
const createPasswordRoutes = require('./routes/create-password');
const documentRoutes = require('./routes/documents');
const mailRoutes = require('./routes/mail');
const authMiddleware = require('./middleware/authMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const userPublicRoutes = require('./routes/userPublicRoutes');

const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
	res.send('API for');
});

//app.use(helmet());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/new-user', createPasswordRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/users-mail', userPublicRoutes);
app.use('/api/report/report', authMiddleware, reportRoutes);
app.use('/api/process-document', documentRoutes);
app.use('/api/report/ia-metrics', authMiddleware, iaMetricsRoutes);
app.use('/api/document/invoice', authMiddleware, invoiceRoutes);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
