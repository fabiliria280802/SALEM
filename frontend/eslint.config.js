const babelParser = require('@babel/eslint-parser');
const reactPlugin = require('eslint-plugin-react');

module.exports = [
	{
		files: ['**/*.js', '**/*.jsx'],
		ignores: ['node_modules/**', 'dist/**'],
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			parser: babelParser,
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: ['@babel/preset-react'],
				},
			},
		},
		plugins: {
			react: reactPlugin,
			'@babel': require('@babel/eslint-plugin'),
		},
		rules: {
			'no-unused-vars': 'off',
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
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
