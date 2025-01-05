import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { useHistory } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../styles/LoginPage.module.css';

import { Toast } from 'primereact/toast';
import publicService from '../services/publicService';
import userService from '../services/userService';
import { Dialog } from 'primereact/dialog';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const toast = useRef(null);
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.current.show({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debe llenar todos los campos del formulario',
        life: 3000,
      });
      return;
    }

    try {
      await login(email, password);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Sesión iniciada correctamente',
        life: 3000,
      });
      history.push('/');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 3000,
      });
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className={styles.container}>
      <img
        src={require('../assets/White-Logo.png')} // Ahora la ubicación es correcta
        alt="Logo"
        className={styles.logo}
      />
      <div className={styles.loginBox}>
        <Toast ref={toast} />
        <h1 className={styles.title}>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="Correo electrónico"
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Contraseña
            </label>
            <div className={styles.formGroup}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Contraseña"
              />
              <Button
                type="button"
                icon={showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'}
                onClick={togglePasswordVisibility}
                className={styles.eyeButton}
              />
            </div>
          </div>
          <Button
            type="submit"
            label="Iniciar sesión"
            className={styles.loginButton}
          />
        </form>
        <div className={styles.separator}>
          <span className={styles.line}></span>
          <span className={styles.orText}>or</span>
          <span className={styles.line}></span>
        </div>
        <Button
          type="button"
          label="Continuar con Microsoft"
          icon="pi pi-microsoft"
          className={styles.microsoftButton}
        />
        <p className={styles.footerText}>
          Inicio de sesión con Microsoft 365 únicamente disponible para
          colaboradores de ENAP.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;


			if (currentAttempts === 3) {
				try {
					const user = await publicService.getUserByEmail(email);
					if (user) {
						console.log('Usuario encontrado para reset:', user);
						setShowPopup(true);
					}
				} catch (err) {
					toast.current.show({
						severity: 'error',
						summary: 'Error',
						detail: err.message || 'Error al enviar correo de restablecimiento',
						life: 3000,
					});
				}
			}
		}
	};






