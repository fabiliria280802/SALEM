const authController = require('../authController');
const { getSharePointFiles } = require('../../services/sharePointService');

jest.mock('../../services/sharePointService');

describe('AuthController', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return a token and user on successful login', async () => {
		const req = {
			body: {
				username: 'testuser',
				password: 'testpassword',
			},
		};
		const res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
		};

		const hashedPassword = require('bcryptjs').hashSync('testpassword', 8);

		getSharePointFiles.mockResolvedValue([
			{
				username: 'testuser',
				password: hashedPassword,
				id: '12345',
			},
		]);

		await authController.login(req, res);

		expect(res.json).toHaveBeenCalledWith({
			token: expect.any(String),
			user: { id: '12345', username: 'testuser' },
		});
	}, 10000);

	it('should return 401 if credentials are incorrect', async () => {
		const req = {
			body: {
				username: 'wronguser',
				password: 'wrongpassword',
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		getSharePointFiles.mockResolvedValue([
			{
				username: 'testuser',
				password: 'hashedpassword',
				id: '12345',
			},
		]);

		await authController.login(req, res);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Credenciales incorrectas',
		});
	}, 10000);

	it('should return 500 if there is an error during authentication', async () => {
		const req = {
			body: {
				username: 'testuser',
				password: 'testpassword',
			},
		};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		getSharePointFiles.mockRejectedValue(
			new Error('Error fetching data from SharePoint'),
		);

		await authController.login(req, res);

		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.json).toHaveBeenCalledWith({
			message: 'Error al autenticar',
			error: 'Error fetching data from SharePoint',
		});
	}, 10000);
});
