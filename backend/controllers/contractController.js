/*
    Description: Contract Controller for create, get, update and delete contracts.
    By: Fabiana Liria
    version: 1.0
*/
const Contract = require('../models/Contract');
const mongoose = require('mongoose');

exports.createContract = async (req, res) => {
    try {
        const {
            contrato_number,
            empresa_contratante,
            empresa_contratada,
            servicio,
            fecha_inicio,
            fecha_termino
        } = req.body;

        const newContract = new Contract({
            contrato_number,
            empresa_contratante,
            empresa_contratada,
            servicio,
            fecha_inicio,
            fecha_termino,
            created_by: req.user.id,
            status: 'Pendiente'
        });

        const savedContract = await newContract.save();
        res.status(201).json(savedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getContracts = async (req, res) => {
    try {
        const contracts = await Contract.find();
        res.status(200).json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getContract = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);
        if (!contract) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }
        res.status(200).json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateContract = async (req, res) => {
    try {
        const updatedContract = await Contract.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedContract) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }
        res.status(200).json(updatedContract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteContract = async (req, res) => {
    try {
        const deletedContract = await Contract.findByIdAndDelete(req.params.id);
        if (!deletedContract) {
            return res.status(404).json({ message: 'Contrato no encontrado' });
        }
        res.status(200).json({ message: 'Contrato eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
