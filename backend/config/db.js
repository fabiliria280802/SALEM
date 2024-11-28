/*
    Description: Setup MongoDB Atlas at the backend
    By: Fabiana Liria
    version: 1.0
*/
const mongoose = require('mongoose');

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('MongoDB Atlas conectado');
	} catch (error) {
		console.error('Error conectando a MongoDB:', error.message);
		process.exit(1);
	}
};

module.exports = connectDB;
