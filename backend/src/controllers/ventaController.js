const { validationResult, body } = require('express-validator');
const { Venta, DetalleVenta, Producto, StockMovimiento, MetodoPago, sequelize } = require('../models');
const { Op } = require('sequelize');

const crear = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, metodo_pago_id } = req.body;

    let totalVenta = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });

      if (!producto) {
        throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      }

      if (producto.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock})`);
      }

      const subtotal = parseFloat((producto.precio_venta * item.cantidad).toFixed(2));
      totalVenta += subtotal;
      detalles.push({ producto, cantidad: item.cantidad, subtotal });
    }

    totalVenta = parseFloat(totalVenta.toFixed(2));

    const numeroTicket = `T-${Date.now().toString().slice(-8)}`;

    const venta = await Venta.create({
      usuario_id: req.usuario.id,
      metodo_pago_id,
      total: totalVenta,
      numero_ticket: numeroTicket,
    }, { transaction });

    for (const detalle of detalles) {
      await DetalleVenta.create({
        venta_id: venta.id,
        producto_id: detalle.producto.id,
        cantidad: detalle.cantidad,
        precio_venta: detalle.producto.precio_venta,
        subtotal: detalle.subtotal,
      }, { transaction });

      await detalle.producto.update({
        stock: detalle.producto.stock - detalle.cantidad,
      }, { transaction });

      await StockMovimiento.create({
        producto_id: detalle.producto.id,
        tipo: 'salida',
        cantidad: detalle.cantidad,
        motivo: `Venta #${numeroTicket}`,
        usuario_id: req.usuario.id,
      }, { transaction });
    }

    await transaction.commit();

    const ventaCompleta = await Venta.findByPk(venta.id, {
      include: [
        { model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: MetodoPago, attributes: ['nombre'] },
      ],
    });

    res.status(201).json(ventaCompleta);
  } catch (error) {
    await transaction.rollback();
    const status = error.message.includes('no encontrado') || error.message.includes('insuficiente') ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
};

const listar = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = {};

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha[Op.gte] = new Date(desde);
      if (hasta) where.fecha[Op.lte] = new Date(hasta);
    }

    const ventas = await Venta.findAll({
      where,
      include: [
        { model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: MetodoPago, attributes: ['nombre'] },
        { model: sequelize.models.Usuario, attributes: ['nombre'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtener = async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: MetodoPago, attributes: ['nombre'] },
        { model: sequelize.models.Usuario, attributes: ['nombre'] },
      ],
    });

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json(venta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateVenta = [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.producto_id').isInt().withMessage('producto_id inválido'),
  body('items.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser >= 1'),
  body('metodo_pago_id').isInt().withMessage('Método de pago requerido'),
];

module.exports = { crear, listar, obtener, validateVenta };
