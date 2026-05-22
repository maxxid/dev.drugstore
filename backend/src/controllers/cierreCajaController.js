const { body, validationResult } = require('express-validator');
const { CierreCaja, Venta, MetodoPago, sequelize } = require('../models');
const { Op } = require('sequelize');

const cerrarCaja = async (req, res) => {
  try {
    const { total_real } = req.body;
    const fecha = new Date().toISOString().split('T')[0];

    const hoy = new Date(fecha);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const ventas = await Venta.findAll({
      where: { fecha: { [Op.gte]: hoy, [Op.lt]: manana } },
      include: [{ model: MetodoPago, attributes: ['nombre'] }],
    });

    let totalEfectivo = 0;
    let totalTarjeta = 0;
    let totalTransferencia = 0;

    for (const venta of ventas) {
      const metodo = venta.MetodoPago?.nombre?.toLowerCase();
      if (metodo === 'efectivo') totalEfectivo += parseFloat(venta.total);
      else if (metodo === 'tarjeta') totalTarjeta += parseFloat(venta.total);
      else if (metodo === 'transferencia') totalTransferencia += parseFloat(venta.total);
    }

    const totalEsperado = totalEfectivo + totalTarjeta + totalTransferencia;

    const cierre = await CierreCaja.create({
      usuario_id: req.usuario.id,
      fecha,
      total_efectivo: totalEfectivo,
      total_tarjeta: totalTarjeta,
      total_transferencia: totalTransferencia,
      total_esperado: parseFloat(totalEsperado.toFixed(2)),
      total_real: parseFloat(total_real || 0),
      diferencia: parseFloat(((total_real || 0) - totalEsperado).toFixed(2)),
    });

    res.status(201).json(cierre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const listar = async (req, res) => {
  try {
    const cierres = await CierreCaja.findAll({
      order: [['created_at', 'DESC']],
      limit: 30,
    });
    res.json(cierres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { cerrarCaja, listar };
