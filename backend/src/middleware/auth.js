const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: Rol, attributes: ['nombre'] }],
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no autorizado' });
    }

    req.usuario = usuario;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.usuario?.Rol?.nombre !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol admin' });
  }
  next();
};

module.exports = { auth, adminOnly };
