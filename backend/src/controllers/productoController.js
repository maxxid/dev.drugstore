const { body, param, validationResult } = require('express-validator');
const { Producto, Categoria } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { search, categoria_id, stock_bajo } = req.query;
    const where = { activo: true };

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { codigo_barras: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (categoria_id) where.categoria_id = categoria_id;
    if (stock_bajo === 'true') where.stock = { [Op.lte]: sequelize.col('stock_minimo') };

    const productos = await Producto.findAll({
      where,
      include: [{ model: Categoria, attributes: ['nombre'] }],
      order: [['nombre', 'ASC']],
    });

    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtener = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Categoria, attributes: ['nombre'] }],
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
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

    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El código de barras ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
};

const actualizar = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update(req.body);
    res.json(producto);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El código de barras ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
};

const eliminar = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await producto.update({ activo: false });
    res.json({ message: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const buscarPorCodigo = async (req, res) => {
  try {
    const producto = await Producto.findOne({
      where: { codigo_barras: req.params.codigo, activo: true },
      include: [{ model: Categoria, attributes: ['nombre'] }],
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const validateProducto = [
  body('codigo_barras').trim().notEmpty().withMessage('Código de barras requerido'),
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('precio_costo').isFloat({ min: 0 }).withMessage('Precio costo inválido'),
  body('precio_venta').isFloat({ min: 0 }).withMessage('Precio venta inválido'),
];

module.exports = {
  listar, obtener, crear, actualizar, eliminar, buscarPorCodigo, validateProducto,
};
