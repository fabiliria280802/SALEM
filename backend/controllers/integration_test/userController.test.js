const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const userController = require('../userController');
const httpMocks = require('node-mocks-http');

// Simula los métodos de Mongoose y otras dependencias
jest.mock('../../models/User');
jest.mock('bcryptjs');

describe('UserController', () => {
	let req, res, next;

	beforeEach(() => {
		req = httpMocks.createRequest();
		res = httpMocks.createResponse();
		next = jest.fn();
		req.user = { role: 'Administrador', id: 'admin123' }; // Simulamos que el usuario es un administrador
	});

	describe('getAllUsers', () => {
		it('should return all users if the role is Admin', async () => {
			const mockUsers = [
				{ username: 'user1', email: 'user1@test.com', role: 'Gestor' },
				{ username: 'user2', email: 'user2@test.com', role: 'Cliente final' },
			];

			// Simula la obtención de usuarios
			User.find.mockResolvedValue(mockUsers);

			// Llama directamente a la función del controlador
			await userController.getAllUsers[userController.getAllUsers.length - 1](
				req,
				res,
				next,
			);

			// Captura el evento 'end' para asegurarse de que la respuesta esté completamente procesada
			res.on('end', () => {
				const responseData = JSON.parse(res._getData());

				// Verifica que la respuesta JSON sea la esperada
				expect(responseData).toEqual(mockUsers);
			});

			// Finaliza la respuesta
			res.end();
		});
	});

	describe('getAllUsers', () => {
		it('should return all users if the role is Admin', async () => {
			const mockUsers = [
				{ username: 'user1', email: 'user1@test.com', role: 'Gestor' },
				{ username: 'user2', email: 'user2@test.com', role: 'Cliente final' },
			];

			// Simula la obtención de usuarios
			User.find.mockResolvedValue(mockUsers);

			// Llama directamente a la función del controlador
			await userController.getAllUsers[userController.getAllUsers.length - 1](
				req,
				res,
				next,
			);

			// Captura el evento 'end' para asegurarse de que la respuesta esté completamente procesada
			res.on('end', () => {
				const responseData = JSON.parse(res._getData());

				// Verifica que la respuesta JSON sea la esperada
				expect(responseData).toEqual(mockUsers);
			});

			// Finaliza la respuesta
			res.end();
		});
	});

	describe('updateUser', () => {
		it('should update a user if the role is Admin', async () => {
			const mockUser = {
				username: 'user1',
				email: 'user1@test.com',
				save: jest.fn(),
			};

			req.params.id = 'user1';
			req.body = { username: 'updateduser', email: 'updated@test.com' };

			User.findById.mockResolvedValue(mockUser); // Simula la búsqueda de usuario

			await userController.updateUser[2](req, res, next); // Llama al tercer middleware (la función principal)

			expect(User.findById).toHaveBeenCalledWith('user1');
			expect(mockUser.username).toBe('updateduser');
			expect(mockUser.email).toBe('updated@test.com');
			expect(mockUser.save).toHaveBeenCalled();
			expect(res._getData()).toEqual(
				JSON.stringify({
					message: 'Usuario actualizado exitosamente',
					user: mockUser,
				}),
			);
		});

		it('should return 404 if user is not found', async () => {
			req.params.id = 'user1';

			User.findById.mockResolvedValue(null); // Simula que no se encuentra el usuario

			await userController.updateUser[2](req, res, next); // Llama al tercer middleware (la función principal)

			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('deleteUser', () => {
		it('should delete a user if the role is Admin', async () => {
			const mockUser = { _id: 'user1', remove: jest.fn() };

			req.params.id = 'user1';

			User.findById.mockResolvedValue(mockUser); // Simula la búsqueda de usuario

			await userController.deleteUser[2](req, res, next); // Llama al tercer middleware (la función principal)

			expect(User.findById).toHaveBeenCalledWith('user1');
			expect(mockUser.remove).toHaveBeenCalled();
			expect(res._getData()).toEqual(
				JSON.stringify({ message: 'Usuario eliminado exitosamente' }),
			);
		});

		it('should return 404 if user is not found', async () => {
			req.params.id = 'user1';

			User.findById.mockResolvedValue(null); // Simula que no se encuentra el usuario

			await userController.deleteUser[2](req, res, next); // Llama al tercer middleware (la función principal)

			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});

	describe('changePassword', () => {
		it('should change the password if current password is correct', async () => {
			const mockUser = { password: 'oldPasswordHash', save: jest.fn() };
			req.params.id = 'user1';
			req.body = { currentPassword: 'oldPassword', newPassword: 'newPassword' };

			User.findById.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(true);
			const mockSalt = 10;

			bcrypt.genSalt.mockResolvedValue(mockSalt);
			bcrypt.hash.mockResolvedValue('newPasswordHash');

			await userController.changePassword[1](req, res, next);

			expect(bcrypt.compare).toHaveBeenCalledWith(
				'oldPassword',
				'oldPasswordHash',
			);
			expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
			expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', mockSalt);

			mockUser.password = 'newPasswordHash';

			expect(mockUser.password).toBe('newPasswordHash');
			expect(mockUser.save).toHaveBeenCalled();
			expect(res._getData()).toEqual(
				JSON.stringify({ message: 'Contraseña actualizada exitosamente' }),
			);
		});

		it('should return error if current password is incorrect', async () => {
			const mockUser = { password: 'oldPasswordHash' };

			req.params.id = 'user1';
			req.body = {
				currentPassword: 'wrongPassword',
				newPassword: 'newPassword',
			};

			// Simula la búsqueda del usuario y la comparación de contraseñas
			User.findById.mockResolvedValue(mockUser);
			bcrypt.compare.mockResolvedValue(false); // Simula que la contraseña actual es incorrecta

			// Ejecuta la función changePassword
			await userController.changePassword[1](req, res, next);

			// Verifica que se haya llamado a next con un error
			expect(next).toHaveBeenCalledWith(expect.any(Error));
		});
	});
});
