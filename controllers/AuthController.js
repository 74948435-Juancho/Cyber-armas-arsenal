const AuthService = require("../services/AuthService");
const jwt = require("jsonwebtoken");

const registrar = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Validación para evitar el error de "undefined"
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const usuario = await AuthService.registrar(nombre, email, password);

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    if (error.message === "El correo ya está registrado") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación para evitar el error de "undefined"
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan credenciales" });
    }

    const usuario = await AuthService.login(email, password);

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    if (error.message === "Credenciales inválidas") {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Exportación como un objeto simple (compatible con las rutas de Express)
module.exports = { registrar, login };
