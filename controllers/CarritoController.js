const CarritoService = require("../services/CarritoService");

// Función auxiliar: Traduce de Sequelize al "Contrato REST" del frontend
const formatearCarrito = async (usuario_id) => {
  const itemsRaw = await CarritoService.obtenerCarrito(usuario_id);

  const items = itemsRaw.map((item) => ({
    armaId: item.arma_id,
    nombre: item.Arma.nombre,
    categoria: item.Arma.categoria,
    precio: item.Arma.precio,
    cantidad: item.cantidad,
  }));

  const total = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  return { items, total };
};

const obtenerCarrito = async (req, res) => {
  try {
    const usuario_id = req.user?.id || req.usuario?.id || req.userId;
    if (!usuario_id)
      return res.status(401).json({ error: "Usuario no autenticado" });

    const carritoFormateado = await formatearCarrito(usuario_id);
    res.json(carritoFormateado);
  } catch (error) {
    console.error("Error al obtener carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const agregarAlCarrito = async (req, res) => {
  try {
    const arma_id =
      req.body.arma_id || req.body.id || req.body.armaId || req.body.productoId;
    const cantidad = req.body.cantidad || 1;
    const usuario_id = req.user?.id || req.usuario?.id || req.userId;

    if (!usuario_id)
      return res.status(401).json({ error: "Usuario no autenticado" });
    if (!arma_id)
      return res.status(400).json({ error: "Falta el ID del arma" });

    await CarritoService.agregarAlCarrito(usuario_id, arma_id, cantidad);

    // Devolvemos el carrito completo y formateado como exige el frontend
    const carritoActualizado = await formatearCarrito(usuario_id);
    res.status(201).json(carritoActualizado);
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const eliminarDelCarrito = async (req, res) => {
  try {
    const arma_id = req.params.id; // El frontend envía el armaId en la URL
    const usuario_id = req.user?.id || req.usuario?.id || req.userId;

    await CarritoService.eliminarDelCarrito(usuario_id, arma_id);

    // Devolvemos el carrito actualizado tras borrar el item
    const carritoActualizado = await formatearCarrito(usuario_id);
    res.json(carritoActualizado);
  } catch (error) {
    console.error("Error al eliminar del carrito:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = { obtenerCarrito, agregarAlCarrito, eliminarDelCarrito };
