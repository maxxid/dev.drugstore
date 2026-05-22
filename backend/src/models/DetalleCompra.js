const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetalleCompra = sequelize.define('DetalleCompra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  compra_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'detalle_compras', timestamps: false });

module.exports = DetalleCompra;
