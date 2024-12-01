/*
    Description: Contract Controller for create, get, update and delete contracts.
    By: Fabiana Liria
    version: 1.0
*/
const Contract = require('../models/Contract');
const mongoose = require('mongoose');

exports.createContract = [
	authMiddleware,
];

exports.getContract = [
	authMiddleware,
];

exports.getContracts = [
	authMiddleware,
];

exports.updateContract = [
	authMiddleware,
];

exports.deleteContract = [
	authMiddleware,
];
