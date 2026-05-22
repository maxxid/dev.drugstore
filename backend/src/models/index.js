const sequelize = require('../config/database');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const Proveedor = require('./Proveedor');
const MetodoPago = require('./MetodoPago');
const Compra = require('./Compra');
const DetalleCompra = require('./DetalleCompra');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const StockMovimiento = require('./StockMovimiento');
const CierreCaja = require('./CierreCaja');
const Insight = require('./Insight');

Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });

Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(Compra, { foreignKey: 'usuario_id' });
Compra.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id' });
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });

Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id' });
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id' });

Producto.hasMany(DetalleCompra, { foreignKey: 'producto_id' });
DetalleCompra.belongsTo(Producto, { foreignKey: 'producto_id' });

Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id' });

MetodoPago.hasMany(Venta, { foreignKey: 'metodo_pago_id' });
Venta.belongsTo(MetodoPago, { foreignKey: 'metodo_pago_id' });

Producto.hasMany(StockMovimiento, { foreignKey: 'producto_id' });
StockMovimiento.belongsTo(Producto, { foreignKey: 'producto_id' });

Usuario.hasMany(CierreCaja, { foreignKey: 'usuario_id' });
CierreCaja.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Categoria,
  Producto,
  Proveedor,
  MetodoPago,
  Compra,
  DetalleCompra,
  Venta,
  DetalleVenta,
  StockMovimiento,
  CierreCaja,
  Insight,
};
