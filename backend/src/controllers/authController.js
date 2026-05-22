const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Usuario, Rol } = require('../models');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({ nombre, email, password_hash: password });

    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, attributes: ['nombre'] }],
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol_id: usuario.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const me = async (req, res) => {
  res.json(req.usuario);
};

const validateRegister = [
  body('nombre').trim().notEmpty().withMessage('Nombre es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Password mínimo 6 caracteres'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password es requerido'),
];

module.exports = { register, login, me, validateRegister, validateLogin };
