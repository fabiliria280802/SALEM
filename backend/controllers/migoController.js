/*
    Description: Migo logic
    By: Fabiana Liria
    version: 1.0
*/
const Migo = require('../models/Migo');
const mongoose = require('mongoose');

exports.createMigo = async (req, res) => {
	try {
		const {
			user_id,
			movement_number,
			movement_type,
			material_description,
			material_code,
			quantity,
			provider_ruc,
			provider_name,
			destination_warehouse,
			movement_date,
			total,
		} = req.body;

		if (!['Entry', 'Exit', 'Transfer'].includes(movement_type)) {
			return res.status(400).json({ error: 'Tipo de movimiento inválido' });
		}

		const migo = new Migo({
			user_id,
			movement_number,
			movement_type,
			material_description,
			material_code,
			quantity,
			provider_ruc,
			provider_name,
			destination_warehouse,
			movement_date,
			total,
		});

		const savedMigo = await migo.save();
		res.status(201).json(savedMigo);
	} catch (error) {
		console.error('Error al crear el MIGO:', error);
		res.status(500).json({ error: 'Error al crear el MIGO' });
	}
};

exports.getAllMigos = async (req, res) => {
	try {
		const migos = await Migo.find().populate('user_id', 'name email'); // Populate para obtener detalles del usuario
		res.status(200).json(migos);
	} catch (error) {
		console.error('Error al obtener los MIGOs:', error);
		res.status(500).json({ error: 'Error al obtener los MIGOs' });
	}
};

exports.getMigoById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de MIGO inválido' });
		}

		const migo = await Migo.findById(id).populate('user_id', 'name email');
		if (!migo) {
			return res.status(404).json({ error: 'MIGO no encontrado' });
		}

		res.status(200).json(migo);
	} catch (error) {
		console.error('Error al obtener el MIGO:', error);
		res.status(500).json({ error: 'Error al obtener el MIGO' });
	}
};

exports.updateMigo = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			movement_type,
			material_description,
			material_code,
			quantity,
			provider_ruc,
			provider_name,
			destination_warehouse,
			movement_date,
			total,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de MIGO inválido' });
		}

		if (
			movement_type &&
			!['Entry', 'Exit', 'Transfer'].includes(movement_type)
		) {
			return res.status(400).json({ error: 'Tipo de movimiento inválido' });
		}

		const updatedMigo = await Migo.findByIdAndUpdate(
			id,
			{
				movement_type,
				material_description,
				material_code,
				quantity,
				provider_ruc,
				provider_name,
				destination_warehouse,
				movement_date,
				total,
			},
			{ new: true },
		);

		if (!updatedMigo) {
			return res.status(404).json({ error: 'MIGO no encontrado' });
		}

		res.status(200).json(updatedMigo);
	} catch (error) {
		console.error('Error al actualizar el MIGO:', error);
		res.status(500).json({ error: 'Error al actualizar el MIGO' });
	}
};

exports.deleteMigo = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de MIGO inválido' });
		}

		const deletedMigo = await Migo.findByIdAndDelete(id);
		if (!deletedMigo) {
			return res.status(404).json({ error: 'MIGO no encontrado' });
		}

		res.status(200).json({ message: 'MIGO eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar el MIGO:', error);
		res.status(500).json({ error: 'Error al eliminar el MIGO' });
	}
};

exports.getMigosByType = async (req, res) => {
	try {
		const { movement_type } = req.params;

		if (!['Entry', 'Exit', 'Transfer'].includes(movement_type)) {
			return res.status(400).json({ error: 'Tipo de movimiento inválido' });
		}

		const migos = await Migo.find({ movement_type }).populate(
			'user_id',
			'name email',
		);
		res.status(200).json(migos);
	} catch (error) {
		console.error('Error al obtener los MIGOs por tipo:', error);
		res.status(500).json({ error: 'Error al obtener los MIGOs por tipo' });
	}
};
