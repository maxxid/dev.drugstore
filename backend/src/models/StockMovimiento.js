const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockMovimiento = sequelize.define('StockMovimiento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.STRING(100) },
  usuario_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'stock_movimientos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = StockMovimiento;
