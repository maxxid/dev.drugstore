const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (usuario) => {
      usuario.password_hash = await bcrypt.hash(usuario.password_hash, 10);
    },
  },
});

Usuario.prototype.validarPassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

Usuario.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = Usuario;
