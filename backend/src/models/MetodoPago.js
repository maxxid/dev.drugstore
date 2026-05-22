const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MetodoPago = sequelize.define('MetodoPago', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, { tableName: 'metodos_pago', timestamps: false });

module.exports = MetodoPago;
