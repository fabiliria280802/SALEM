const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

jest.mock('../../middleware/authMiddleware', () => (req, res, next) => {
  req.user = { id: 'mockedUserId', role: 'Administrador' }; // Usuario autenticado simulado
  next();
});

jest.mock('../../helpers/roleHelper', () => ({
  isAdmin: (req, res, next) => {
    if (req.user.role !== 'Administrador') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    next();
  },
}));

beforeAll(async () => {
  jest.setTimeout(30000);
  const uri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/test_db';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
  await User.deleteMany({}); // Limpia todos los usuarios después de cada prueba
  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('User Controller - /api/users', () => {
  const validRUC = '1757797202001'; // Usa un RUC válido para las pruebas

  it('debería crear un usuario exitosamente', async () => {
    const newUser = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: validRUC,
      email: 'carlos.julio@example.com',
      role: 'Proveedor',
    };

    const response = await request(app)
      .post('/api/users/')
      .send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe(
      'Usuario creado exitosamente. Se ha enviado un correo para la creación de la contraseña.',
    );
    expect(response.body.user).toMatchObject({
      name: newUser.name,
      email: newUser.email,
      ruc: newUser.ruc,
    });
  });

  it('debería retornar un error si el usuario ya existe', async () => {
    const newUser = {
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: validRUC,
      email: 'carlos.julio@example.com',
      role: 'Proveedor',
    };

    await new User(newUser).save(); // Inserta el usuario

    const response = await request(app)
      .post('/api/users/')
      .send(newUser);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('El usuario ya existe');
  });

  it('debería retornar una lista de usuarios', async () => {
    const users = [
      { name: 'Carlos', last_name: 'Julio', phone: '0987654321', company_name: 'Mi Empresa', ruc: validRUC, email: 'carlos.julio@example.com', role: 'Proveedor' },
      { name: 'Maria', last_name: 'Perez', phone: '0987654322', company_name: 'Otra Empresa', ruc: '1754773495001', email: 'maria.perez@example.com', role: 'Gestor' },
    ];

    await User.insertMany(users);

    const response = await request(app).get('/api/users/');

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(response.body[0].name).toBe('Carlos');
  });

  it('debería actualizar un usuario', async () => {
    const user = new User({
      name: 'Carlos',
      last_name: 'Julio',
      phone: '0987654321',
      company_name: 'Mi Empresa',
      ruc: validRUC,
      email: 'carlos.julio@example.com',
      role: 'Proveedor',
    });

    const savedUser = await user.save();

    const updatedData = {
      name: 'Carlos Modificado',
    };

    const response = await request(app)
      .put(`/api/users/${savedUser._id}`)
      .send(updatedData);

    expect(response.status).toBe(200);
    expect(response.body.user.name).toBe('Carlos Modificado');
  });
});


  
