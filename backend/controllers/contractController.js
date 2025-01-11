/*
    Description: Contract Controller for create, get, update and delete contracts.
    By: Fabiana Liria
    version: 1.0
*/
const Contract = require('../models/Contract');
const { spawn } = require('child_process');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

exports.createContract = [
	authMiddleware,
	async (req, res, next) => {
		const { ruc, contract, documentType } = req.body;
		try {
			const file = req.file;

			if (documentType !== 'Contract') {
				return res.status(400).json({
					error: 'Tipo de documento inválido',
					details: `Se esperaba 'Contract', se recibió '${documentType}'`,
				});
			}

			if (!file) {
				return res
					.status(400)
					.json({ error: 'No se ha proporcionado un archivo' });
			}

			const newContract = new Contract({
				contract_number: contract,
				file_path: path.join('data', 'docs', file.filename),
				status: 'Analizando',
				created_by: req.user.id,
			});

			await newContract.save();

			const filePath = path.join(process.cwd(), newContract.file_path);
			const pythonProcess = spawn('python3', [
				'controllers/IA/ia.py',
				'--action', 'predict',            // <-- ¡Bandera obligatoria!
				'--file_path', filePath,          // <-- Pasa la ruta del archivo
				'--document_type', documentType,   // <-- "Contract", si es un contrato
				'--ruc', req.body.ruc,            // <-- si lo necesitas en tu script
				'--contract', req.body.contract

			], {
				env: {
					...process.env,
					TESSDATA_PREFIX: '/usr/share/tesseract/tessdata', 
				},
			});
			

			let pythonOutput = '';
			let pythonError = '';
			
			// Recolecta la salida estándar
			pythonProcess.stdout.on('data', (data) => {
			  pythonOutput += data.toString();
			});
			
			// Recolecta la salida de error
			pythonProcess.stderr.on('data', (data) => {
			  console.error('Error de Python:', data.toString());
			  pythonError += data.toString();
			});

			pythonProcess.on('close', (code) => {
				if (pythonError) {
				  return res.status(500).json({
					error: 'Error en el proceso de Python',
					details: pythonError,
				  });
				}
				try {
				  // Si Python imprime un JSON, parsea la salida
				  const result = JSON.parse(pythonOutput);
				  // Envía resultado al frontend
				  return res.status(200).json({ success: true, data: result });
				} catch (err) {
				  return res.status(500).json({
					error: 'Error parseando la respuesta de Python',
					details: err.message,
				  });
				}
			  });

		} catch (error) {
			console.error('Error completo:', error);
			res.status(500).json({
				error: 'Error interno del servidor',
				details: error.message,
			});
		}
	},
];

exports.getContractById = [
	authMiddleware,
	async (req, res, next) => {
		try {
			const contract = await Contract.findById(req.params.id);
			if (!contract) {
				return res.status(404).json({ error: 'Contrato no encontrado' });
			}
			res.status(200).json(contract);
		} catch (error) {
			res.status(500).json({ error: 'Error al obtener el contrato' });
		}
	},
];

exports.updateContract = [
	authMiddleware,
	async (req, res) => {
		try {
			const updatedContract = await Contract.findByIdAndUpdate(
				req.params.id,
				req.body,
				{ new: true },
			);
			if (!updatedContract) {
				return res.status(404).json({ error: 'Contrato no encontrado' });
			}
			res.status(200).json(updatedContract);
		} catch (error) {
			res.status(500).json({ error: 'Error al actualizar el contrato' });
		}
	},
];

exports.deleteContract = [
	authMiddleware,
	async (req, res) => {
		try {
			const deletedContract = await Contract.findByIdAndDelete(req.params.id);
			if (!deletedContract) {
				return res.status(404).json({ message: 'Contrato no encontrado' });
			}
			res.status(200).json({ message: 'Contrato eliminado exitosamente' });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	},
];
