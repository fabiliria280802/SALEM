const babelParser = require('@babel/eslint-parser');

module.exports = [
	{
		files: ['**/*.js'],
		ignores: ['node_modules/**', 'dist/**'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: ['@babel/preset-env'],
				},
			},
			globals: {
				require: 'readonly',
				module: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				console: 'readonly',
				Buffer: 'readonly',
			},
		},
		plugins: {
			'@babel': require('@babel/eslint-plugin'),
		},
		rules: {
			'no-unused-vars': 'off',
		},
		settings: {},
	},
	{
		files: ['.eslintrc.js', 'eslint.config.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'script',
		},
		rules: {},
	},
];
