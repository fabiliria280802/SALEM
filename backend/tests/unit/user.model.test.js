const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

let mongoServer;

beforeAll(async () => {
    jest.setTimeout(30000); // 30 segundos
    const uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test_db'; // Usa variable de entorno para MongoDB Atlas
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Conexión exitosa a MongoDB.');
    } catch (err) {
      console.error('Error conectando a MongoDB:', err);
      throw err;
    }
  });
  
  afterAll(async () => {
    try {
        await User.deleteMany({});
        console.log('Desconexión exitosa de MongoDB.');
    } catch (err) {
        console.error('Error desconectando MongoDB:', err);
    }
  });
  

describe('User Model', () => {
  it('debería validar un usuario con datos válidos', async () => {
    const userData = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: '1757797202001',
      email: 'carlos.julio1@example.com',
      password: 'password123',
      role: 'Administrador',
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.ruc).toBe(userData.ruc);
  });

  it('debería fallar al guardar un usuario con un RUC inválido', async () => {
    const userData = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: '1234567890123', // RUC inválido
      email: 'carlos.julio1@example.com',
      password: 'password123',
      role: 'Administrador',
    };

    const user = new User(userData);
    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.ruc.message).toBe('El RUC ingresado no es válido.');
  });

  it('debería hashear la contraseña antes de guardar', async () => {
    const userData = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: '1757797202001',
      email: 'carlos.julio2@example.com',
      password: 'password123',
      role: 'Administrador',
    };

    const user = new User(userData);
    await user.save();

    expect(user.password).not.toBe(userData.password);
    const isMatch = await bcrypt.compare('password123', user.password);
    expect(isMatch).toBe(true);
  });

  it('debería fallar al guardar un usuario con un correo inválido', async () => {
    const userData = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: '1757797202001',
      email: 'correo-invalido', // Correo inválido
      password: 'password123',
      role: 'Administrador',
    };

    const user = new User(userData);
    let error;
    try {
      await user.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.errors.email.message).toBe('El correo electrónico ingresado no es válido.');
  });
});
