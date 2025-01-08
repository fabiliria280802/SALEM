module.exports = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Archivo de configuración adicional
	transform: {
	  '^.+\\.jsx?$': 'babel-jest', // Usa Babel para transformar archivos JS/JSX
	  '^.+\\.css$': '<rootDir>/node_modules/jest-transform-css', // Procesa archivos CSS
	},
	moduleNameMapper: {
	  '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mapea estilos a objetos mock
	  '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js', // Mock para archivos estáticos
	},
	transformIgnorePatterns: [
	  'node_modules/(?!(primereact|other-esm-library)/)', // Incluye dependencias ESM específicas
	],
	testEnvironment: 'jsdom', // Entorno de pruebas para React
	moduleFileExtensions: ['js', 'jsx', 'json', 'node'], // Extensiones soportadas
  };
  