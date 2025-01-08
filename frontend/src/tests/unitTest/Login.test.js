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

test('submits login form', () => {
  const mockLogin = jest.fn(); // Mock para la función login

  render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <Login />
    </AuthContext.Provider>,
    { wrapper: MemoryRouter }
  );

  fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
    target: { value: 'testuser@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/Contraseña/i), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByRole('button', { name: /Iniciar sesión/i }));

  // Verifica que la función `login` fue llamada
  expect(mockLogin).toHaveBeenCalledTimes(1);
});
