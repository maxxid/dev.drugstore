const { Insight } = require('../models');
const insightCollectorService = require('../services/insightCollectorService');

const listar = async (req, res) => {
  try {
    const insights = await Insight.findAll({
      order: [['created_at', 'DESC']],
      limit: 30,
    });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generarAhora = async (req, res) => {
  try {
    const { tipo } = req.body;
    const tiposValidos = ['diario', 'semanal', 'mensual'];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ error: `Tipo invalido. Usar: ${tiposValidos.join(', ')}` });
    }

    const insight = await insightCollectorService.generarInsightConIA(tipo);
    res.status(201).json(insight);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listar, generarAhora };
