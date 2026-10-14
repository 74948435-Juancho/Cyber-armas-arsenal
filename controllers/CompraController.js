const compraService = require('../services/CompraService');

class CompraController {
  procesar = (req, res) => {
    try {
      res.json(compraService.procesarCompra(req.usuario.id));
    } catch (e) {
      if (e.status) return res.status(e.status).json({ mensaje: e.message });
      console.error(e);
      res.status(500).json({ mensaje: 'Error al procesar la compra' });
    }
  };
}

module.exports = new CompraController();