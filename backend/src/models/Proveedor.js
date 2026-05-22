const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  contacto: { type: DataTypes.STRING(100) },
  telefono: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(100) },
  direccion: { type: DataTypes.TEXT },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'proveedores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Proveedor;
