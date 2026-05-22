const { Venta, DetalleVenta, Producto, Categoria, Compra, Insight, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class InsightCollectorService {
  async recolectarDatos(tipo) {
    const hoy = new Date();
    let fechaInicio, fechaFin;

    switch (tipo) {
      case 'diario':
        fechaInicio = new Date(hoy);
        fechaInicio.setHours(0, 0, 0, 0);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + 1);
        break;
      case 'semanal':
        fechaFin = new Date(hoy);
        fechaFin.setHours(0, 0, 0, 0);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setDate(fechaInicio.getDate() - 7);
        break;
      case 'mensual':
        fechaFin = new Date(hoy);
        fechaFin.setHours(0, 0, 0, 0);
        fechaInicio = new Date(fechaFin);
        fechaInicio.setMonth(fechaInicio.getMonth() - 1);
        break;
      default:
        throw new Error('Tipo inválido');
    }

    const where = { fecha: { [Op.gte]: fechaInicio, [Op.lt]: fechaFin } };

    const totalVentas = await Venta.findOne({
      where: where.fecha ? { fecha: where } : {},
      attributes: [
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('total')), 'total'],
      ],
      raw: true,
    });

    const topProductos = await DetalleVenta.findAll({
      attributes: [
        'producto_id',
        [fn('SUM', col('cantidad')), 'cantidad_vendida'],
      ],
      include: [{ model: Producto, attributes: ['nombre', 'precio_costo', 'precio_venta'] }],
      group: ['producto_id', 'Producto.id', 'Producto.nombre', 'Producto.precio_costo', 'Producto.precio_venta'],
      order: [[fn('SUM', col('cantidad')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    const stockCritico = await Producto.findAll({
      where: { activo: true, stock: { [Op.lte]: literal('stock_minimo') } },
      attributes: ['nombre', 'stock', 'stock_minimo'],
      raw: true,
    });

    const productosMasMargen = await Producto.findAll({
      where: { activo: true },
      attributes: [
        'nombre',
        [literal('precio_venta - precio_costo'), 'margen'],
      ],
      order: [[literal('precio_venta - precio_costo'), 'DESC']],
      limit: 10,
      raw: true,
    });

    return {
      tipo,
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: fechaFin.toISOString().split('T')[0],
      total_ventas: totalVentas,
      top_productos: topProductos,
      stock_critico: stockCritico,
      productos_mas_margen: productosMasMargen,
    };
  }

  async generarInsight(tipo) {
    const datos = await this.recolectarDatos(tipo);

    const insight = await Insight.create({
      tipo,
      fecha_inicio: datos.fecha_inicio,
      fecha_fin: datos.fecha_fin,
      datos_json: datos,
      resumen: 'Pendiente de análisis IA',
      recomendaciones: 'Pendiente',
    });

    return insight;
  }
}

module.exports = new InsightCollectorService();
