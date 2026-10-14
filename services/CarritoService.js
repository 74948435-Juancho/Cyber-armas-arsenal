const Carrito = require("../models/CarritoModel");
const Arma = require("../models/ArmaModel");

class CarritoService {
  async obtenerCarrito(usuario_id) {
    return await Carrito.findAll({
      where: { usuario_id },
      include: [{ model: Arma }],
    });
  }

  async agregarAlCarrito(usuario_id, arma_id, cantidad = 1) {
    const itemExistente = await Carrito.findOne({
      where: { usuario_id, arma_id },
    });

    if (itemExistente) {
      itemExistente.cantidad += parseInt(cantidad);
      await itemExistente.save();
      return itemExistente;
    } else {
      return await Carrito.create({ usuario_id, arma_id, cantidad });
    }
  }

  async eliminarDelCarrito(usuario_id, arma_id) {
    // AHORA BORRA CORRECTAMENTE BUSCANDO POR EL ID DEL ARMA
    return await Carrito.destroy({
      where: { arma_id, usuario_id },
    });
  }
}

module.exports = new CarritoService();