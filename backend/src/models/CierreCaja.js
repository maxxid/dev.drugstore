const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CierreCaja = sequelize.define('CierreCaja', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  total_efectivo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_tarjeta: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_transferencia: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_esperado: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_real: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  diferencia: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, {
  tableName: 'cierres_caja',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = CierreCaja;
