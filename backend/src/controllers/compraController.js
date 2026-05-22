const { body, validationResult } = require('express-validator');
const { Compra, DetalleCompra, Producto, Proveedor, StockMovimiento, sequelize } = require('../models');

const crear = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { proveedor_id, items } = req.body;

    let totalCompra = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      if (!producto) {
        throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      }
      const subtotal = parseFloat((item.precio_costo * item.cantidad).toFixed(2));
      totalCompra += subtotal;
      detalles.push({ producto, cantidad: item.cantidad, precio_costo: item.precio_costo, subtotal });
    }

    const compra = await Compra.create({
      proveedor_id,
      usuario_id: req.usuario.id,
      total: parseFloat(totalCompra.toFixed(2)),
      estado: 'recibida',
    }, { transaction });

    for (const detalle of detalles) {
      await DetalleCompra.create({
        compra_id: compra.id,
        producto_id: detalle.producto.id,
        cantidad: detalle.cantidad,
        precio_costo: detalle.precio_costo,
        subtotal: detalle.subtotal,
      }, { transaction });

      await detalle.producto.update({
        stock: detalle.producto.stock + detalle.cantidad,
        precio_costo: detalle.precio_costo,
      }, { transaction });

      await StockMovimiento.create({
        producto_id: detalle.producto.id,
        tipo: 'entrada',
        cantidad: detalle.cantidad,
        motivo: `Compra #${compra.id}`,
        usuario_id: req.usuario.id,
      }, { transaction });
    }

    await transaction.commit();

    const compraCompleta = await Compra.findByPk(compra.id, {
      include: [
        { model: DetalleCompra, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: Proveedor, attributes: ['nombre'] },
      ],
    });

    res.status(201).json(compraCompleta);
  } catch (error) {
    await transaction.rollback();
    res.status(error.message.includes('no encontrado') ? 400 : 500).json({ error: error.message });
  }
};

const listar = async (req, res) => {
  try {
    const compras = await Compra.findAll({
      include: [
        { model: Proveedor, attributes: ['nombre'] },
        { model: sequelize.models.Usuario, attributes: ['nombre'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(compras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtener = async (req, res) => {
  try {
    const compra = await Compra.findByPk(req.params.id, {
      include: [
        { model: DetalleCompra, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: Proveedor, attributes: ['nombre'] },
      ],
    });
    if (!compra) return res.status(404).json({ error: 'Compra no encontrada' });
    res.json(compra);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateCompra = [
  body('proveedor_id').isInt().withMessage('Proveedor requerido'),
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
  body('items.*.producto_id').isInt().withMessage('producto_id inválido'),
  body('items.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser >= 1'),
  body('items.*.precio_costo').isFloat({ min: 0 }).withMessage('Precio costo inválido'),
];

module.exports = { crear, listar, obtener, validateCompra };
