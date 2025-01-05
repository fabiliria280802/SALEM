import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import authService from '../services/authService';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const initializeAuth = () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const decodedUser = jwtDecode(token);
                    console.log('Datos del token:', decodedUser);
                    setUser(decodedUser);
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error('Error decodificando el token:', error);
                    authService.logout();
                }
            }
            setLoading(false); // Asegúrate de que siempre cambie a false
        };

        initializeAuth();
    }, []);

	const login = async (email, password) => {
		try {
			const userData = await authService.login(email, password);
			const token = userData.token; // Asegúrate de que el token esté aquí
			if (!token) {
				throw new Error('No se pudo obtener el token de autenticación');
			}

			const decodedUser = jwtDecode(token);
			console.log('Usuario decodificado:', decodedUser);
			setUser(decodedUser);
			setIsAuthenticated(true);
			localStorage.setItem('token', token);
		} catch (error) {
			console.error('Error en la función login:', error.message);
			throw error; // Lanza el error para manejarlo en el componente LoginPage
		}
	};

	const logout = () => {
		authService.logout();
		setUser(null);
		setIsAuthenticated(false);
		localStorage.removeItem('token');
	};

	return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export { AuthContext, AuthProvider };
