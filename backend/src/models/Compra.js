const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Compra = sequelize.define('Compra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  estado: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Compra;
