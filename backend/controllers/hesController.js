/*
    Description: Hes logic
    By: Fabiana Liria
    version: 1.0
*/

const Hes = require('../models/Hes');
const mongoose = require('mongoose');

exports.createHes = async (req, res) => {
	try {
		const {
			user_id,
			service_code,
			service_description,
			provider_ruc,
			provider_name,
			service_start_date,
			service_end_date,
			total,
		} = req.body;

		if (
			service_end_date &&
			new Date(service_end_date) < new Date(service_start_date)
		) {
			return res.status(400).json({
				error:
					'La fecha de finalización no puede ser anterior a la fecha de inicio',
			});
		}

		const hes = new Hes({
			user_id,
			service_code,
			service_description,
			provider_ruc,
			provider_name,
			service_start_date,
			service_end_date,
			total,
		});

		const savedHes = await hes.save();
		res.status(201).json(savedHes);
	} catch (error) {
		console.error('Error al crear el HES:', error);
		res.status(500).json({ error: 'Error al crear el HES' });
	}
};

exports.getAllHes = async (req, res) => {
	try {
		const hesRecords = await Hes.find().populate('user_id', 'name email');
		res.status(200).json(hesRecords);
	} catch (error) {
		console.error('Error al obtener los registros HES:', error);
		res.status(500).json({ error: 'Error al obtener los registros HES' });
	}
};

exports.getHesById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de HES inválido' });
		}

		const hes = await Hes.findById(id).populate('user_id', 'name email');
		if (!hes) {
			return res.status(404).json({ error: 'Registro HES no encontrado' });
		}

		res.status(200).json(hes);
	} catch (error) {
		console.error('Error al obtener el registro HES:', error);
		res.status(500).json({ error: 'Error al obtener el registro HES' });
	}
};

exports.updateHes = async (req, res) => {
	try {
		const { id } = req.params;
		const {
			service_code,
			service_description,
			provider_ruc,
			provider_name,
			service_start_date,
			service_end_date,
			total,
		} = req.body;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de HES inválido' });
		}

		if (
			service_end_date &&
			new Date(service_end_date) < new Date(service_start_date)
		) {
			return res.status(400).json({
				error:
					'La fecha de finalización no puede ser anterior a la fecha de inicio',
			});
		}

		const updatedHes = await Hes.findByIdAndUpdate(
			id,
			{
				service_code,
				service_description,
				provider_ruc,
				provider_name,
				service_start_date,
				service_end_date,
				total,
			},
			{ new: true },
		);

		if (!updatedHes) {
			return res.status(404).json({ error: 'Registro HES no encontrado' });
		}

		res.status(200).json(updatedHes);
	} catch (error) {
		console.error('Error al actualizar el HES:', error);
		res.status(500).json({ error: 'Error al actualizar el HES' });
	}
};

exports.deleteHes = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: 'ID de HES inválido' });
		}

		const deletedHes = await Hes.findByIdAndDelete(id);
		if (!deletedHes) {
			return res.status(404).json({ error: 'Registro HES no encontrado' });
		}

		res.status(200).json({ message: 'Registro HES eliminado correctamente' });
	} catch (error) {
		console.error('Error al eliminar el registro HES:', error);
		res.status(500).json({ error: 'Error al eliminar el registro HES' });
	}
};

exports.getHesByProviderRuc = async (req, res) => {
	try {
		const { provider_ruc } = req.params;

		const hesRecords = await Hes.find({ provider_ruc }).populate(
			'user_id',
			'name email',
		);
		if (!hesRecords.length) {
			return res.status(404).json({
				error: 'No se encontraron registros HES para este proveedor RUC',
			});
		}

		res.status(200).json(hesRecords);
	} catch (error) {
		console.error(
			'Error al obtener los registros HES por RUC de proveedor:',
			error,
		);
		res.status(500).json({
			error: 'Error al obtener los registros HES por RUC de proveedor',
		});
	}
};
