import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import CreateUserPage from '../../pages/CreateUserPage';
import userService from '../../services/userService';

// Mock del servicio userService
jest.mock('../../services/userService', () => ({
    createUser: jest.fn(),
}));

describe('CreateUserPage', () => {
    it('renders the form correctly', () => {
        render(
            <MemoryRouter>
                <CreateUserPage />
            </MemoryRouter>
        );

        // Verifica los campos clave
        expect(screen.getByLabelText(/Nombres/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Correo/i)).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /Rol/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guardar/i })).toBeInTheDocument();
    });

    it('calls createUser service on form submit', async () => {
        const toastRef = { current: { show: jest.fn() } };

        render(
            <MemoryRouter>
                <Toast ref={toastRef} />
                <CreateUserPage />
            </MemoryRouter>
        );

        // Completa el formulario
        fireEvent.change(screen.getByLabelText(/Nombres/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/Correo/i), {
            target: { value: 'testuser@example.com' },
        });

        // Interactúa con el dropdown de rol
        fireEvent.click(screen.getByRole('combobox', { name: /Rol/i }));
        fireEvent.click(screen.getByText('Admin'));

        // Envía el formulario
        fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

        // Verifica que el servicio se llama con los datos correctos
        expect(userService.createUser).toHaveBeenCalledWith({
            name: 'Test User',
            email: 'testuser@example.com',
            role: 'Admin',
        });

        // Verifica que se haya mostrado un mensaje en el Toast
        expect(toastRef.current.show).toHaveBeenCalledWith({
            severity: 'success',
            summary: 'Usuario creado',
            detail: 'El usuario ha sido creado exitosamente.',
        });
    });

    it('shows error toast on service failure', async () => {
        const toastRef = { current: { show: jest.fn() } };
        userService.createUser.mockRejectedValueOnce(new Error('Error al crear usuario'));

        render(
            <MemoryRouter>
                <Toast ref={toastRef} />
                <CreateUserPage />
            </MemoryRouter>
        );

        // Completa el formulario
        fireEvent.change(screen.getByLabelText(/Nombres/i), {
            target: { value: 'Test User' },
        });
        fireEvent.change(screen.getByLabelText(/Correo/i), {
            target: { value: 'testuser@example.com' },
        });

        // Interactúa con el dropdown de rol
        fireEvent.click(screen.getByRole('combobox', { name: /Rol/i }));
        fireEvent.click(screen.getByText('Admin'));

        // Envía el formulario
        fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

        // Verifica que se haya mostrado un mensaje de error en el Toast
        expect(toastRef.current.show).toHaveBeenCalledWith({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear usuario',
        });
    });
});

