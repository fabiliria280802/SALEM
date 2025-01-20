import React from 'react';
import styles from '../../styles/LoadingScreen.module.css'; // Mantén la importación correcta

const LoadingScreen = () => {
  return (
    <div className={styles['loading-container']}> {/* Usa styles para aplicar las clases */}
      <div className={styles['loading-spinner']}>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <p className={styles['loading-text']}>
        Cargando<span>.</span><span>.</span><span>.</span>
      </p>
    </div>
  );
};

export default LoadingScreen;

