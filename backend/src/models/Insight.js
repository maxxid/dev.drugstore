const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Insight = sequelize.define('Insight', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.ENUM('diario', 'semanal', 'mensual'), allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  resumen: { type: DataTypes.TEXT },
  recomendaciones: { type: DataTypes.TEXT },
  datos_json: { type: DataTypes.JSONB },
}, {
  tableName: 'insights',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Insight;
