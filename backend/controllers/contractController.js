/*
    Description: Contract Controller for create, get, update, and delete contracts, including rejected contract details.
    By: Fabiana Liria
    version: 1.1
*/
const Contract = require('../models/Contract');
const mongoose = require('mongoose');
const path = require('path');
const { spawn } = require('child_process');
const authMiddleware = require('../middleware/authMiddleware');

// Crear un contrato
exports.createContract = async (req, res) => {
    try {
        const { contract_number, provider_ruc, documentType } = req.body;

<<<<<<< Updated upstream
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
=======
        // Validación del tipo de documento
        if (documentType !== 'Contract') {
            return res.status(400).json({
                error: 'Tipo de documento inválido',
                details: `Se esperaba 'Contract', se recibió '${documentType}'`,
            });
        }

        // Validación del archivo
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó un archivo para el contrato' });
        }

        const filePath = path.join('data', 'docs', req.file.filename);
        const newContract = new Contract({
            contract_number,
            provider_ruc,
            file_path: filePath,
            status: 'Pendiente',
            created_by: req.user.id,
        });
>>>>>>> Stashed changes

        await newContract.save();
        res.status(201).json({ message: 'Contrato creado correctamente', newContract });
    } catch (error) {
        console.error('Error al crear el contrato:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener todos los contratos
exports.getAllContracts = async (req, res) => {
    try {
        const contracts = await Contract.find();
        res.status(200).json(contracts);
    } catch (error) {
        console.error('Error al obtener contratos:', error);
        res.status(500).json({ message: 'Error al obtener contratos' });
    }
};

// Obtener contrato por ID
exports.getContractById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de contrato inválido' });
        }

        const contract = await Contract.findById(id);
        if (!contract) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        res.status(200).json(contract);
    } catch (error) {
        console.error('Error al obtener el contrato:', error);
        res.status(500).json({ error: 'Error interno al obtener el contrato' });
    }
};

// Obtener contratos rechazados y sus razones
exports.getRejectedContracts = async (req, res) => {
    try {
        const rejectedContracts = await Contract.find({ status: 'Denegado' })
            .select('contract_number provider_ruc validation_errors missing_fields')
            .lean();

        if (!rejectedContracts.length) {
            return res.status(404).json({ message: 'No se encontraron contratos rechazados.' });
        }

        const response = rejectedContracts.map(contract => ({
            contractNumber: contract.contract_number,
            providerRuc: contract.provider_ruc,
            validationErrors: contract.validation_errors,
            missingFields: contract.missing_fields,
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error('Error al obtener contratos rechazados:', error);
        res.status(500).json({ message: 'Error interno al obtener contratos rechazados' });
    }
};

// Actualizar un contrato
exports.updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, validation_errors, ai_decision_explanation } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de contrato inválido' });
        }

        const updatedContract = await Contract.findByIdAndUpdate(
            id,
            {
                status,
                validation_errors,
                ai_decision_explanation,
            },
            { new: true }
        );

        if (!updatedContract) {
            return res.status(404).json({ error: 'Contrato no encontrado para actualizar' });
        }

        res.status(200).json(updatedContract);
    } catch (error) {
        console.error('Error al actualizar el contrato:', error);
        res.status(500).json({ error: 'Error interno al actualizar el contrato' });
    }
};

// Eliminar un contrato
exports.deleteContract = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID de contrato inválido' });
        }

        const deletedContract = await Contract.findByIdAndDelete(id);
        if (!deletedContract) {
            return res.status(404).json({ error: 'Contrato no encontrado para eliminar' });
        }

        res.status(200).json({ message: 'Contrato eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el contrato:', error);
        res.status(500).json({ error: 'Error interno al eliminar el contrato' });
    }
};
