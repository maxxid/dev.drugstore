const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_barras: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  categoria_id: { type: DataTypes.INTEGER },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, defaultValue: 5 },
  fecha_vencimiento: { type: DataTypes.DATEONLY },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Producto;
