const express = require('express');
const {
	getAUser,
	getAllUsers,
	createUser,
	updateUser,
	suspendUser,
	changePassword,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getAUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:currentUserId/:userIdToModify', changePassword);
//TODO: validar flujo de suspend
router.put('/suspend/:id', suspendUser);

module.exports = router;
