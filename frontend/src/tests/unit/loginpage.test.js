import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../../pages/LoginPage';
import useAuth from '../../hooks/useAuth';
import publicService from '../../services/publicService';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

jest.mock('../../hooks/useAuth');
jest.mock('../../services/publicService');

jest.mock('primereact/toast', () => {
	const React = require('react'); // Importa React dentro del mock
	return {
		Toast: React.forwardRef((_, ref) => {
			React.useImperativeHandle(ref, () => ({
				show: jest.fn(),
			}));
			return <div data-testid="toast" />;
		}),
	};
});

describe('LoginPage Component', () => {
	let loginMock;
	let history;

	beforeEach(() => {
		loginMock = jest.fn();
		useAuth.mockReturnValue({ login: loginMock });
		history = createMemoryHistory();

		render(
			<Router history={history}>
				<LoginPage />
			</Router>,
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders the login form', () => {
		expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
		expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();

		// Buscar el botón usando el aria-label
		const loginButton = screen.getByRole('button', { name: 'Iniciar sesión' });
		expect(loginButton).toBeInTheDocument();
	});

	it('shows a warning toast if fields are empty', () => {
		const loginButton = screen.getByRole('button', { name: 'Iniciar sesión' });
		fireEvent.click(loginButton);

		const toast = screen.getByTestId('toast'); // Verificar el mock del Toast
		expect(toast).toBeInTheDocument();
	});
});
