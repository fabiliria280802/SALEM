import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/LoginPage';

/* FIX: creacte unit test
test('renders login form', () => {
	render(<Login />, { wrapper: MemoryRouter });
	expect(screen.getByLabelText(/Usuario/i)).toBeInTheDocument();
	expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();
});

test('submits login form', async () => {
	render(<Login />, { wrapper: MemoryRouter });
	fireEvent.change(screen.getByLabelText(/Usuario/i), {
		target: { value: 'testuser' },
	});
	fireEvent.change(screen.getByLabelText(/Contraseña/i), {
		target: { value: 'password' },
	});
	fireEvent.click(screen.getByText(/Ingresar/i));
	// Add assertions to check for successful login
});
*/
