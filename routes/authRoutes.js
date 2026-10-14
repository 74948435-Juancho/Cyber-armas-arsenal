const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/AuthController");

// Rutas de autenticación
router.post("/register", AuthController.registrar);
router.post("/login", AuthController.login);

// Si tenías otras rutas aquí (como un GET /me o GET /logout),
// las hemos omitido temporalmente para que el servidor pueda levantar.

module.exports = router;
