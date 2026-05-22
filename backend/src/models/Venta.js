const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Venta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  metodo_pago_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  numero_ticket: { type: DataTypes.STRING(20), allowNull: false, unique: true },
}, {
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Venta;
