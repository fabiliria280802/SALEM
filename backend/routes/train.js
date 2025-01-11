const express = require('express');
const {
	trainModel
} = require('../controllers/trainController');

const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/', upload.single('file'), trainModel);

module.exports = router;