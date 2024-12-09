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
            contract_number,
            contracting_company,
            contracted_company,
            service,
            start_date,
            end_date
        } = req.body;

        const newContract = new Contract({
            contract_number,
            contracting_company,
            contracted_company,
            service,
            start_date,
            end_date,
            created_by: req.user.id,
            status: 'Pending'
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
