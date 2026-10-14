require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// 1. Importamos la conexión de Sequelize y el modelo que usaremos en esta ruta
const sequelize = require("./db/database");
const Arma = require("./models/ArmaModel");

const app = express();

app.use(helmet());
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.static("public"));

// Rutas externas
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/carrito", require("./routes/carritoRoutes"));
app.use("/api/compras", require("./routes/comprasRoutes"));

// 2. Ruta adaptada al ORM Sequelize
app.get("/api/armas", async (req, res) => {
  try {
    // Busca todos los registros en la tabla 'armas' de forma asíncrona
    const armas = await Arma.findAll();
    res.json(armas);
  } catch (error) {
    console.error("Error al obtener las armas:", error);
    res.status(500).json({ error: "Error al obtener las armas" });
  }
});

const PORT = process.env.PORT || 3000;

// 3. Sincronizar Sequelize y arrancar el servidor
sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("Base de datos conectada con Sequelize exitosamente.");
    app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Error al conectar la base de datos:", error);
  });
