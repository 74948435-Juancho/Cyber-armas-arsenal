const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/authMiddleware');
const compraController = require('../controllers/CompraController');

// Requiere token JWT para procesar la compra
router.post('/', verificarToken, compraController.procesar);

module.exports = router;