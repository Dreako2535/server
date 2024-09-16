const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');

router.post('/guardar-resultados', resultController.guardarResultados);

module.exports = router;
