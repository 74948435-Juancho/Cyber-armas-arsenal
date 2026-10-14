const sequelize = require("../db/database");
const Compra = require("../models/CompraModel");
const DetalleCompra = require("../models/DetalleCompraModel");
const Carrito = require("../models/CarritoModel");
const Arma = require("../models/ArmaModel");

class CompraService {
  async procesarCompra(usuario_id) {
    // Iniciamos una transacción segura (si algo falla, se revierte todo)
    const t = await sequelize.transaction();

    try {
      const itemsCarrito = await Carrito.findAll({
        where: { usuario_id },
        include: [Arma],
        transaction: t,
      });

      if (itemsCarrito.length === 0) {
        throw new Error("El carrito está vacío");
      }

      let total = 0;
      // Verificar stock y calcular total
      for (const item of itemsCarrito) {
        if (item.Arma.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para el arma: ${item.Arma.nombre}`,
          );
        }
        total += item.Arma.precio * item.cantidad;
      }

      // 1. Crear el registro general de la compra
      const nuevaCompra = await Compra.create(
        {
          usuario_id,
          total,
        },
        { transaction: t },
      );

      // 2. Registrar cada arma en el detalle y descontar stock
      for (const item of itemsCarrito) {
        await DetalleCompra.create(
          {
            compra_id: nuevaCompra.id,
            arma_id: item.arma_id,
            cantidad: item.cantidad,
            precio_unitario: item.Arma.precio,
          },
          { transaction: t },
        );

        // Descontar del stock original
        await item.Arma.decrement("stock", {
          by: item.cantidad,
          transaction: t,
        });
      }

      // 3. Vaciar el carrito del usuario
      await Carrito.destroy({ where: { usuario_id }, transaction: t });

      // Confirmar todos los cambios en la base de datos
      await t.commit();
      return nuevaCompra;
    } catch (error) {
      // Si hubo algún error (ej. falta de stock), revertir todo
      await t.rollback();
      throw error;
    }
  }

  async obtenerHistorial(usuario_id) {
    return await Compra.findAll({
      where: { usuario_id },
      include: [
        {
          model: DetalleCompra,
          include: [Arma],
        },
      ],
      order: [["fecha", "DESC"]],
    });
  }
}

module.exports = new CompraService();
