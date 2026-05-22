const { body, validationResult } = require('express-validator');
const { Proveedor } = require('../models');

const listar = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']],
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crear = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await proveedor.update(req.body);
    res.json(proveedor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await proveedor.update({ activo: false });
    res.json({ message: 'Proveedor desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateProveedor = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
];

module.exports = { listar, crear, actualizar, eliminar, validateProveedor };
