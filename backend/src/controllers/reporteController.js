const { Venta, DetalleVenta, Producto, MetodoPago, Categoria, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const resumenVentas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const whereFecha = {};

    if (desde) whereFecha[Op.gte] = new Date(desde);
    if (hasta) whereFecha[Op.lte] = new Date(hasta);

    const totalGeneral = await Venta.findOne({
      where: whereFecha.fecha ? { fecha: whereFecha } : {},
      attributes: [
        [fn('COUNT', col('id')), 'cantidad_ventas'],
        [fn('SUM', col('total')), 'total_vendido'],
        [fn('AVG', col('total')), 'ticket_promedio'],
      ],
      raw: true,
    });

    const topProductos = await DetalleVenta.findAll({
      attributes: [
        'producto_id',
        [fn('SUM', col('cantidad')), 'total_vendido'],
        [fn('SUM', col('subtotal')), 'total_ingresos'],
      ],
      include: [{ model: Producto, attributes: ['nombre'] }],
      group: ['producto_id', 'Producto.id', 'Producto.nombre'],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      limit: 10,
      raw: true,
      nest: true,
    });

    const ventasPorMetodo = await Venta.findAll({
      attributes: [
        'metodo_pago_id',
        [fn('SUM', col('total')), 'total'],
        [fn('COUNT', col('id')), 'cantidad'],
      ],
      include: [{ model: MetodoPago, attributes: ['nombre'] }],
      group: ['metodo_pago_id', 'MetodoPago.id', 'MetodoPago.nombre'],
      raw: true,
      nest: true,
    });

    const ventasPorCategoria = await DetalleVenta.findAll({
      attributes: [[fn('SUM', col('subtotal')), 'total']],
      include: [
        {
          model: Producto,
          attributes: [],
          include: [{ model: Categoria, attributes: ['nombre'] }],
        },
      ],
      group: ['Producto->Categoria.id', 'Producto->Categoria.nombre'],
      raw: true,
      nest: true,
    });

    res.json({
      totalGeneral,
      topProductos,
      ventasPorMetodo,
      ventasPorCategoria,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const stockBajo = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      where: {
        activo: true,
        stock: { [Op.lte]: literal('stock_minimo') },
      },
      order: [['stock', 'ASC']],
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resumenDiario = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const ventas = await Venta.findAll({
      where: { fecha: { [Op.gte]: hoy, [Op.lt]: manana } },
      attributes: [
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('total')), 'total'],
      ],
      raw: true,
    });

    res.json({
      fecha: hoy.toISOString().split('T')[0],
      cantidad_ventas: ventas[0].cantidad || 0,
      total: parseFloat(ventas[0].total || 0).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { resumenVentas, stockBajo, resumenDiario };
