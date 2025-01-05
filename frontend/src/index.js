import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Asegúrate de que aquí solo se importa el CSS necesario procesado por Webpack
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

// Opcional: medir el rendimiento de tu app
reportWebVitals();
