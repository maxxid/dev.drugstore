const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op, fn, col, literal } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 3, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  retry: { max: 3 },
});

const Rol = sequelize.define('Rol', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, { tableName: 'roles', timestamps: false });

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'usuarios',
  timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
});

Usuario.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

Usuario.prototype.validarPassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

const Categoria = sequelize.define('Categoria', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categorias', timestamps: false });

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
}, { tableName: 'productos', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  contacto: { type: DataTypes.STRING(100) },
  telefono: { type: DataTypes.STRING(30) },
  email: { type: DataTypes.STRING(100) },
  direccion: { type: DataTypes.TEXT },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'proveedores', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const MetodoPago = sequelize.define('MetodoPago', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, { tableName: 'metodos_pago', timestamps: false });

const Compra = sequelize.define('Compra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  estado: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
}, { tableName: 'compras', timestamps: true, createdAt: 'created_at', updatedAt: false });

const DetalleCompra = sequelize.define('DetalleCompra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  compra_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_costo: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'detalle_compras', timestamps: false });

const Venta = sequelize.define('Venta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  metodo_pago_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  total: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  numero_ticket: { type: DataTypes.STRING(20), allowNull: false, unique: true },
}, { tableName: 'ventas', timestamps: true, createdAt: 'created_at', updatedAt: false });

const DetalleVenta = sequelize.define('DetalleVenta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  venta_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  precio_venta: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, { tableName: 'detalle_ventas', timestamps: false });

const StockMovimiento = sequelize.define('StockMovimiento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.STRING(100) },
  usuario_id: { type: DataTypes.INTEGER },
}, { tableName: 'stock_movimientos', timestamps: true, createdAt: 'created_at', updatedAt: false });

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
}, { tableName: 'cierres_caja', timestamps: true, createdAt: 'created_at', updatedAt: false });

const Insight = sequelize.define('Insight', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.ENUM('diario', 'semanal', 'mensual'), allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  resumen: { type: DataTypes.TEXT },
  recomendaciones: { type: DataTypes.TEXT },
  datos_json: { type: DataTypes.JSONB },
}, { tableName: 'insights', timestamps: true, createdAt: 'created_at', updatedAt: false });

const ProductoProveedor = sequelize.define('ProductoProveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  proveedor_id: { type: DataTypes.INTEGER, allowNull: false },
  ultimo_precio: { type: DataTypes.DECIMAL(10, 2) },
  fecha_ultimo_precio: { type: DataTypes.DATE },
}, {
  tableName: 'productos_proveedores',
  timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['producto_id', 'proveedor_id'] }],
});

const Oferta = sequelize.define('Oferta', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.ENUM('porcentaje', 'fijo'), allowNull: false },
  valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  descripcion: { type: DataTypes.STRING(200) },
}, { tableName: 'ofertas', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Remito = sequelize.define('Remito', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.ENUM('entrada', 'salida'), allowNull: false },
  proveedor_id: { type: DataTypes.INTEGER },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  numero: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  observaciones: { type: DataTypes.TEXT },
}, { tableName: 'remitos', timestamps: true, createdAt: 'created_at', updatedAt: false });

const DetalleRemito = sequelize.define('DetalleRemito', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  remito_id: { type: DataTypes.INTEGER, allowNull: false },
  producto_id: { type: DataTypes.INTEGER, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'detalle_remitos', timestamps: false });

Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });
Proveedor.hasMany(Compra, { foreignKey: 'proveedor_id' });
Compra.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
Usuario.hasMany(Compra, { foreignKey: 'usuario_id' });
Compra.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Compra.hasMany(DetalleCompra, { foreignKey: 'compra_id' });
DetalleCompra.belongsTo(Compra, { foreignKey: 'compra_id' });
Producto.hasMany(DetalleCompra, { foreignKey: 'producto_id' });
DetalleCompra.belongsTo(Producto, { foreignKey: 'producto_id' });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id' });
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
Producto.hasMany(ProductoProveedor, { foreignKey: 'producto_id' });
ProductoProveedor.belongsTo(Producto, { foreignKey: 'producto_id' });
Proveedor.hasMany(ProductoProveedor, { foreignKey: 'proveedor_id' });
ProductoProveedor.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });
Producto.hasMany(Oferta, { foreignKey: 'producto_id' });
Oferta.belongsTo(Producto, { foreignKey: 'producto_id' });
Remito.hasMany(DetalleRemito, { foreignKey: 'remito_id' });
DetalleRemito.belongsTo(Remito, { foreignKey: 'remito_id' });
Producto.hasMany(DetalleRemito, { foreignKey: 'producto_id' });
DetalleRemito.belongsTo(Producto, { foreignKey: 'producto_id' });
Usuario.hasMany(Remito, { foreignKey: 'usuario_id' });
Remito.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Proveedor.hasMany(Remito, { foreignKey: 'proveedor_id' });
Remito.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });

// ─── Auth Middleware ───
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id, { include: [{ model: Rol, attributes: ['nombre'] }] });
    if (!usuario || !usuario.activo) return res.status(401).json({ error: 'Usuario no autorizado' });
    req.usuario = usuario;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalido o expirado' });
  }
};

// ─── Express App ───
const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { email }, include: [{ model: Rol, attributes: ['nombre'] }] });
    if (!usuario || !usuario.activo || !(await usuario.validarPassword(password))) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', auth, (req, res) => res.json(req.usuario));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(400).json({ error: 'El email ya esta registrado' });
    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, email, password_hash: hash });
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ usuario, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Productos
app.get('/api/productos', auth, async (req, res) => {
  try {
    const { search, categoria_id, stock_bajo, proveedor_id, sort } = req.query;
    const where = { activo: true };
    if (search) where[Op.or] = [{ nombre: { [Op.iLike]: `%${search}%` } }, { codigo_barras: { [Op.iLike]: `%${search}%` } }];
    if (categoria_id) where.categoria_id = categoria_id;
    if (stock_bajo === 'true') where.stock = { [Op.lte]: literal('stock_minimo') };

    const include = [
      { model: Categoria, attributes: ['nombre'] },
      { model: ProductoProveedor, include: [{ model: Proveedor, attributes: ['id', 'nombre'] }], separate: true },
      { model: Oferta, where: { activo: true, fecha_inicio: { [Op.lte]: new Date().toISOString().split('T')[0] }, fecha_fin: { [Op.gte]: new Date().toISOString().split('T')[0] } }, required: false, separate: true },
    ];

    if (proveedor_id) {
      const prodsIds = await ProductoProveedor.findAll({
        where: { proveedor_id: parseInt(proveedor_id) },
        attributes: ['producto_id'],
        raw: true,
      });
      where.id = { [Op.in]: prodsIds.map((p) => p.producto_id) };
    }

    let order = [['nombre', 'ASC']];
    if (sort === 'stock_asc') order = [['stock', 'ASC']];
    else if (sort === 'stock_desc') order = [['stock', 'DESC']];
    else if (sort === 'weekly_movement') {
      order = [[fn('COALESCE', literal('(SELECT SUM("cantidad") FROM "detalle_ventas" dv JOIN "ventas" v ON v."id" = dv."venta_id" WHERE dv."producto_id" = "Producto"."id" AND v."fecha" >= NOW() - INTERVAL \'7 days\')'), 0), 'DESC']];
    }

    const productos = await Producto.findAll({ where, include, order, subQuery: !proveedor_id });
    res.json(productos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/productos/codigo/:codigo', auth, async (req, res) => {
  try {
    const producto = await Producto.findOne({ where: { codigo_barras: req.params.codigo, activo: true }, include: [{ model: Categoria, attributes: ['nombre'] }] });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/productos/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, { include: [{ model: Categoria, attributes: ['nombre'] }] });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/productos', auth, async (req, res) => {
  try {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(400).json({ error: 'Codigo de barras ya existe' });
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/productos/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.update(req.body);
    res.json(producto);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/productos/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await producto.update({ activo: false });
    res.json({ message: 'Producto desactivado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Proveedores del producto
app.get('/api/productos/:id/proveedores', auth, async (req, res) => {
  try {
    const proveedores = await ProductoProveedor.findAll({
      where: { producto_id: req.params.id },
      include: [{ model: Proveedor, attributes: ['id', 'nombre'] }],
      order: [['fecha_ultimo_precio', 'DESC']],
    });
    res.json(proveedores);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Historial de precios
app.get('/api/productos/:id/historial-precios', auth, async (req, res) => {
  try {
    const compras = await DetalleCompra.findAll({
      where: { producto_id: req.params.id },
      include: [
        { model: Compra, attributes: ['fecha', 'proveedor_id'], include: [{ model: Proveedor, attributes: ['nombre'] }] },
      ],
      order: [[{ model: Compra }, 'fecha', 'DESC']],
      limit: 50,
    });
    const historial = compras.map((dc) => ({
      proveedor: dc.Compra?.Proveedor?.nombre || 'Desconocido',
      proveedor_id: dc.Compra?.proveedor_id,
      precio: parseFloat(dc.precio_costo),
      fecha: dc.Compra?.fecha,
      cantidad: dc.cantidad,
    }));
    res.json(historial);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// CSV Export/Import
app.get('/api/productos/exportar', auth, async (req, res) => {
  try {
    const productos = await Producto.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
    const header = 'codigo_barras,nombre,descripcion,categoria_id,precio_costo,precio_venta,stock,stock_minimo';
    const rows = productos.map((p) =>
      [p.codigo_barras, `"${(p.nombre || '').replace(/"/g, '""')}"`, `"${(p.descripcion || '').replace(/"/g, '""')}"`, p.categoria_id || '', p.precio_costo, p.precio_venta, p.stock, p.stock_minimo].join(',')
    );
    const csv = [header, ...rows].join('\n') + '\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.csv');
    res.send(csv);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/productos/importar', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo CSV requerido' });
    const csvText = req.file.buffer.toString('utf-8');
    const lines = csvText.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return res.status(400).json({ error: 'CSV vacio o sin datos' });

    const header = lines[0].toLowerCase();
    const codigoIdx = header.split(',').findIndex((h) => h.trim() === 'codigo_barras');
    const nombreIdx = header.split(',').findIndex((h) => h.trim() === 'nombre');

    if (codigoIdx === -1 || nombreIdx === -1) {
      return res.status(400).json({ error: 'CSV debe tener columnas codigo_barras y nombre' });
    }

    let creados = 0;
    let actualizados = 0;
    let errores = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 2) { errores++; continue; }

      const codigo = cols[codigoIdx]?.trim();
      const nombre = cols[nombreIdx]?.trim();
      if (!codigo || !nombre) { errores++; continue; }

      const descIdx = header.split(',').findIndex((h) => h.trim() === 'descripcion');
      const catIdx = header.split(',').findIndex((h) => h.trim() === 'categoria_id');
      const pcIdx = header.split(',').findIndex((h) => h.trim() === 'precio_costo');
      const pvIdx = header.split(',').findIndex((h) => h.trim() === 'precio_venta');
      const stIdx = header.split(',').findIndex((h) => h.trim() === 'stock');
      const smIdx = header.split(',').findIndex((h) => h.trim() === 'stock_minimo');

      const data = {
        codigo_barras: codigo,
        nombre: nombre,
        descripcion: descIdx >= 0 ? cols[descIdx]?.trim() || null : null,
        categoria_id: catIdx >= 0 ? (parseInt(cols[catIdx]) || null) : null,
        precio_costo: pcIdx >= 0 ? parseFloat(cols[pcIdx]) || 0 : 0,
        precio_venta: pvIdx >= 0 ? parseFloat(cols[pvIdx]) || 0 : 0,
        stock: stIdx >= 0 ? parseInt(cols[stIdx]) || 0 : 0,
        stock_minimo: smIdx >= 0 ? parseInt(cols[smIdx]) || 5 : 5,
      };

      try {
        const existente = await Producto.findOne({ where: { codigo_barras: data.codigo_barras } });
        if (existente) {
          await existente.update(data);
          actualizados++;
        } else {
          await Producto.create(data);
          creados++;
        }
      } catch (e) {
        errores++;
      }
    }

    res.json({ message: `Importacion completada: ${creados} creados, ${actualizados} actualizados, ${errores} errores` });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Ventas
app.post('/api/ventas', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, metodo_pago_id } = req.body;
    let totalVenta = 0;
    let totalDescuento = 0;
    const detalles = [];
    const hoy = new Date().toISOString().split('T')[0];

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      if (!producto) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      if (producto.stock < item.cantidad) throw new Error(`Stock insuficiente para "${producto.nombre}"`);

      let precioUnitario = parseFloat(producto.precio_venta);

      const oferta = await Oferta.findOne({
        where: {
          producto_id: item.producto_id,
          activo: true,
          fecha_inicio: { [Op.lte]: hoy },
          fecha_fin: { [Op.gte]: hoy },
        },
        transaction,
      });

      if (oferta) {
        if (oferta.tipo === 'porcentaje') {
          precioUnitario = parseFloat((precioUnitario * (1 - parseFloat(oferta.valor) / 100)).toFixed(2));
        } else {
          precioUnitario = parseFloat((precioUnitario - parseFloat(oferta.valor)).toFixed(2));
          if (precioUnitario < 0) precioUnitario = 0;
        }
        totalDescuento += parseFloat((parseFloat(producto.precio_venta) - precioUnitario) * item.cantidad);
      }

      const subtotal = parseFloat((precioUnitario * item.cantidad).toFixed(2));
      totalVenta += subtotal;
      detalles.push({ producto, cantidad: item.cantidad, precio_venta: precioUnitario, subtotal, oferta });
    }

    totalVenta = parseFloat(totalVenta.toFixed(2));
    const numeroTicket = `T-${Date.now().toString().slice(-8)}`;
    const venta = await Venta.create({ usuario_id: req.usuario.id, metodo_pago_id, total: totalVenta, numero_ticket: numeroTicket }, { transaction });

    for (const d of detalles) {
      await DetalleVenta.create({ venta_id: venta.id, producto_id: d.producto.id, cantidad: d.cantidad, precio_venta: d.precio_venta, subtotal: d.subtotal }, { transaction });
      await d.producto.update({ stock: d.producto.stock - d.cantidad }, { transaction });
      await StockMovimiento.create({ producto_id: d.producto.id, tipo: 'salida', cantidad: d.cantidad, motivo: `Venta #${numeroTicket}`, usuario_id: req.usuario.id }, { transaction });
    }

    await transaction.commit();
    const ventaCompleta = await Venta.findByPk(venta.id, { include: [{ model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] }, { model: MetodoPago, attributes: ['nombre'] }] });
    res.status(201).json({ ...ventaCompleta.toJSON(), total_descuento: totalDescuento });
  } catch (error) {
    await transaction.rollback();
    res.status(error.message.includes('no encontrado') || error.message.includes('insuficiente') ? 400 : 500).json({ error: error.message });
  }
});

app.get('/api/ventas', auth, async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      include: [{ model: DetalleVenta, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] }, { model: MetodoPago, attributes: ['nombre'] }, { model: Usuario, attributes: ['nombre'] }],
      order: [['created_at', 'DESC']], limit: 100,
    });
    res.json(ventas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Compras
app.post('/api/compras', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { proveedor_id, items } = req.body;
    let totalCompra = 0;
    const detalles = [];

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      if (!producto) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      const subtotal = parseFloat((item.precio_costo * item.cantidad).toFixed(2));
      totalCompra += subtotal;
      detalles.push({ producto, cantidad: item.cantidad, precio_costo: item.precio_costo, subtotal });
    }

    const compra = await Compra.create({ proveedor_id, usuario_id: req.usuario.id, total: parseFloat(totalCompra.toFixed(2)), estado: 'recibida' }, { transaction });

    for (const d of detalles) {
      await DetalleCompra.create({ compra_id: compra.id, producto_id: d.producto.id, cantidad: d.cantidad, precio_costo: d.precio_costo, subtotal: d.subtotal }, { transaction });
      await d.producto.update({ stock: d.producto.stock + d.cantidad, precio_costo: d.precio_costo }, { transaction });
      await StockMovimiento.create({ producto_id: d.producto.id, tipo: 'entrada', cantidad: d.cantidad, motivo: `Compra #${compra.id}`, usuario_id: req.usuario.id }, { transaction });
      await ProductoProveedor.upsert({
        producto_id: d.producto.id,
        proveedor_id: parseInt(proveedor_id),
        ultimo_precio: d.precio_costo,
        fecha_ultimo_precio: new Date(),
      }, { transaction });
    }

    await transaction.commit();
    const compraCompleta = await Compra.findByPk(compra.id, { include: [{ model: DetalleCompra, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] }, { model: Proveedor, attributes: ['nombre'] }] });
    res.status(201).json(compraCompleta);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/compras', auth, async (req, res) => {
  try {
    const compras = await Compra.findAll({ include: [{ model: Proveedor, attributes: ['nombre'] }, { model: Usuario, attributes: ['nombre'] }], order: [['created_at', 'DESC']], limit: 100 });
    res.json(compras);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Proveedores
app.get('/api/proveedores', auth, async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({ where: { activo: true }, order: [['nombre', 'ASC']] });
    res.json(proveedores);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/proveedores', auth, async (req, res) => {
  try {
    const proveedor = await Proveedor.create(req.body);
    res.status(201).json(proveedor);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/proveedores/:id', auth, async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await proveedor.update(req.body);
    res.json(proveedor);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/proveedores/:id', auth, async (req, res) => {
  try {
    const proveedor = await Proveedor.findByPk(req.params.id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado' });
    await proveedor.update({ activo: false });
    res.json({ message: 'Proveedor desactivado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Reportes
app.get('/api/reportes/ventas', auth, async (req, res) => {
  try {
    const totalGeneral = await Venta.findOne({
      attributes: [[fn('COUNT', col('id')), 'cantidad_ventas'], [fn('SUM', col('total')), 'total_vendido'], [fn('AVG', col('total')), 'ticket_promedio']], raw: true,
    });

    const topProductos = await DetalleVenta.findAll({
      attributes: ['producto_id', [fn('SUM', col('cantidad')), 'total_vendido'], [fn('SUM', col('subtotal')), 'total_ingresos']],
      include: [{ model: Producto, attributes: ['nombre'] }],
      group: ['producto_id', 'Producto.id', 'Producto.nombre'],
      order: [[fn('SUM', col('cantidad')), 'DESC']], limit: 10, raw: true, nest: true,
    });

    const ventasPorMetodo = await Venta.findAll({
      attributes: ['metodo_pago_id', [fn('SUM', col('total')), 'total'], [fn('COUNT', col('id')), 'cantidad']],
      include: [{ model: MetodoPago, attributes: ['nombre'] }],
      group: ['metodo_pago_id', 'MetodoPago.id', 'MetodoPago.nombre'], raw: true, nest: true,
    });

    res.json({ totalGeneral, topProductos, ventasPorMetodo });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/reportes/stock-bajo', auth, async (req, res) => {
  try {
    const productos = await Producto.findAll({ where: { activo: true, stock: { [Op.lte]: literal('stock_minimo') } }, order: [['stock', 'ASC']] });
    res.json(productos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/reportes/diario', auth, async (req, res) => {
  try {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
    const ventas = await Venta.findAll({
      where: { fecha: { [Op.gte]: hoy, [Op.lt]: manana } },
      attributes: [[fn('COUNT', col('id')), 'cantidad'], [fn('SUM', col('total')), 'total']], raw: true,
    });
    res.json({ fecha: hoy.toISOString().split('T')[0], cantidad_ventas: parseInt(ventas[0].cantidad || 0), total: parseFloat(ventas[0].total || 0).toFixed(2) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Cierre de caja
app.post('/api/cierres', auth, async (req, res) => {
  try {
    const { total_real } = req.body;
    const fecha = new Date().toISOString().split('T')[0];
    const hoy = new Date(fecha); const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

    const ventas = await Venta.findAll({ where: { fecha: { [Op.gte]: hoy, [Op.lt]: manana } }, include: [{ model: MetodoPago, attributes: ['nombre'] }] });
    let totalEfectivo = 0, totalTarjeta = 0, totalTransferencia = 0;
    for (const v of ventas) {
      const metodo = v.MetodoPago?.nombre?.toLowerCase();
      if (metodo === 'efectivo') totalEfectivo += parseFloat(v.total);
      else if (metodo === 'tarjeta') totalTarjeta += parseFloat(v.total);
      else if (metodo === 'transferencia') totalTransferencia += parseFloat(v.total);
    }

    const totalEsperado = totalEfectivo + totalTarjeta + totalTransferencia;
    const cierre = await CierreCaja.create({
      usuario_id: req.usuario.id, fecha,
      total_efectivo: totalEfectivo, total_tarjeta: totalTarjeta, total_transferencia: totalTransferencia,
      total_esperado: parseFloat(totalEsperado.toFixed(2)), total_real: parseFloat(total_real || 0),
      diferencia: parseFloat(((total_real || 0) - totalEsperado).toFixed(2)),
    });
    res.status(201).json(cierre);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Insights
app.get('/api/insights', auth, async (req, res) => {
  try {
    const insights = await Insight.findAll({ order: [['created_at', 'DESC']], limit: 30 });
    res.json(insights);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/insights/generar', auth, async (req, res) => {
  try {
    const { tipo } = req.body;
    const hoy = new Date();
    let fechaInicio, fechaFin;
    if (tipo === 'diario') { fechaInicio = new Date(hoy); fechaInicio.setHours(0,0,0,0); fechaFin = new Date(fechaInicio); fechaFin.setDate(fechaFin.getDate()+1); }
    else if (tipo === 'semanal') { fechaFin = new Date(hoy); fechaFin.setHours(0,0,0,0); fechaInicio = new Date(fechaFin); fechaInicio.setDate(fechaInicio.getDate()-7); }
    else if (tipo === 'mensual') { fechaFin = new Date(hoy); fechaFin.setHours(0,0,0,0); fechaInicio = new Date(fechaFin); fechaInicio.setMonth(fechaInicio.getMonth()-1); }
    else return res.status(400).json({ error: 'Tipo invalido' });

    const where = { fecha: { [Op.gte]: fechaInicio, [Op.lt]: fechaFin } };
    const totalVentas = await Venta.findOne({ where, attributes: [[fn('COUNT', col('id')), 'cantidad'], [fn('SUM', col('total')), 'total']], raw: true });
    const topProductos = await DetalleVenta.findAll({ attributes: ['producto_id', [fn('SUM', col('cantidad')), 'cantidad_vendida'], [fn('SUM', col('subtotal')), 'ingresos']], include: [{ model: Producto, attributes: ['nombre'] }], group: ['producto_id', 'Producto.id', 'Producto.nombre'], order: [[fn('SUM', col('cantidad')), 'DESC']], limit: 5, raw: true, nest: true });
    const stockCritico = await Producto.findAll({ where: { activo: true, stock: { [Op.lte]: literal('stock_minimo') } }, attributes: ['nombre', 'stock', 'stock_minimo'], raw: true });

    const resumen = `${tipo.toUpperCase()}: ${parseInt(totalVentas?.cantidad || 0)} ventas, $${parseFloat(totalVentas?.total || 0).toFixed(2)} total. ${stockCritico.length} productos con stock bajo.`;
    const recomendaciones = stockCritico.length > 0 ? 'URGENTE: Comprar productos con stock bajo.\n' + stockCritico.map(p => `- ${p.nombre}: ${p.stock} (min: ${p.stock_minimo})`).join('\n') : 'Todo en orden.';

    const insight = await Insight.create({ tipo, fecha_inicio: fechaInicio.toISOString().split('T')[0], fecha_fin: fechaFin.toISOString().split('T')[0], datos_json: {}, resumen, recomendaciones });
    res.status(201).json(insight);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === ',') { result.push(current); current = ''; }
      else { current += char; }
    }
  }
  result.push(current);
  return result;
}

// ─── Ofertas ───
app.get('/api/ofertas', auth, async (req, res) => {
  try {
    const ofertas = await Oferta.findAll({
      include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }],
      order: [['created_at', 'DESC']],
    });
    res.json(ofertas);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/ofertas', auth, async (req, res) => {
  try {
    const oferta = await Oferta.create(req.body);
    res.status(201).json(oferta);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/ofertas/:id', auth, async (req, res) => {
  try {
    const oferta = await Oferta.findByPk(req.params.id);
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    await oferta.update(req.body);
    res.json(oferta);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/ofertas/:id', auth, async (req, res) => {
  try {
    const oferta = await Oferta.findByPk(req.params.id);
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });
    await oferta.update({ activo: false });
    res.json({ message: 'Oferta desactivada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ─── Remitos ───
app.get('/api/remitos', auth, async (req, res) => {
  try {
    const remitos = await Remito.findAll({
      include: [
        { model: DetalleRemito, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: Proveedor, attributes: ['nombre'] },
        { model: Usuario, attributes: ['nombre'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });
    res.json(remitos);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/remitos', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { tipo, proveedor_id, items, observaciones } = req.body;
    const fecha = new Date();
    const numero = `R-${tipo === 'entrada' ? 'E' : 'S'}-${Date.now().toString().slice(-8)}`;

    const remito = await Remito.create({
      tipo, proveedor_id: proveedor_id || null, usuario_id: req.usuario.id,
      fecha, numero, observaciones: observaciones || '',
    }, { transaction });

    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction });
      if (!producto) throw new Error(`Producto ID ${item.producto_id} no encontrado`);

      await DetalleRemito.create({
        remito_id: remito.id, producto_id: item.producto_id, cantidad: item.cantidad,
      }, { transaction });

      const delta = tipo === 'entrada' ? item.cantidad : -item.cantidad;
      await producto.update({ stock: producto.stock + delta }, { transaction });

      await StockMovimiento.create({
        producto_id: item.producto_id,
        tipo: tipo,
        cantidad: item.cantidad,
        motivo: `Remito #${numero}`,
        usuario_id: req.usuario.id,
      }, { transaction });
    }

    await transaction.commit();
    const remitoCompleto = await Remito.findByPk(remito.id, {
      include: [
        { model: DetalleRemito, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: Proveedor, attributes: ['nombre'] },
      ],
    });
    res.status(201).json(remitoCompleto);
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/remitos/:id', auth, async (req, res) => {
  try {
    const remito = await Remito.findByPk(req.params.id, {
      include: [
        { model: DetalleRemito, include: [{ model: Producto, attributes: ['nombre', 'codigo_barras'] }] },
        { model: Proveedor, attributes: ['nombre'] },
        { model: Usuario, attributes: ['nombre'] },
      ],
    });
    if (!remito) return res.status(404).json({ error: 'Remito no encontrado' });
    res.json(remito);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = app;
