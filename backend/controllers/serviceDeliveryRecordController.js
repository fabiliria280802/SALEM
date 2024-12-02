/*
    Description: ServiceDeliveryRecord Controller for create, get, update and delete services.
    By: Fabiana Liria
    version: 1.0
*/
const ServiceDeliveryRecord = require('../models/serviceDeliveryRecord');
const mongoose = require('mongoose');

// Create new service delivery record
exports.reateServiceDeliveryRecord = async (req, res) => {
    try {
        const {
            hes_number,
            empresa_receptora,
            servicio,
            ubicacion,
            nombres,
            cargos,
            contrato,
            fecha_inicio,
            fecha_termino
        } = req.body;

        const newRecord = new ServiceDeliveryRecord({
            hes_number,
            empresa_receptora,
            servicio,
            ubicacion,
            firmas: [
                {
                    nombre: nombres[0],
                    cargo: cargos[0],
                    tipo: 'Proveedor'
                },
                {
                    nombre: nombres[1],
                    cargo: cargos[1],
                    tipo: 'Receptor'
                }
            ],
            contrato,
            fecha_inicio,
            fecha_termino,
            created_by: req.user.id
        });

        const savedRecord = await newRecord.save();
        res.status(201).json(savedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all service delivery records
exports.getAllServiceDeliveryRecords = async (req, res) => {
    try {
        const records = await ServiceDeliveryRecord.find();
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get service delivery record by ID
exports.getServiceDeliveryRecordById = async (req, res) => {
    try {
        const record = await ServiceDeliveryRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update service delivery record
exports.updateServiceDeliveryRecord = async (req, res) => {
    try {
        const updatedRecord = await ServiceDeliveryRecord.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedRecord) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        res.status(200).json(updatedRecord);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete service delivery record
exports.deleteServiceDeliveryRecord = async (req, res) => {
    try {
        const deletedRecord = await ServiceDeliveryRecord.findByIdAndDelete(req.params.id);
        if (!deletedRecord) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        res.status(200).json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
