const express = require("express");
const router = express.Router();
const CarritoController = require("../controllers/CarritoController");
const authMiddleware = require("../middleware/authMiddleware"); // Tu middleware que valida el token JWT

// Todas las rutas del carrito requieren que el usuario haya iniciado sesión
router.use(authMiddleware);

router.get("/", CarritoController.obtenerCarrito);
router.post("/", CarritoController.agregarAlCarrito);
router.delete("/:id", CarritoController.eliminarDelCarrito);

module.exports = router;
