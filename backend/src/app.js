const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productoRoutes = require('./routes/productos');
const ventaRoutes = require('./routes/ventas');
const compraRoutes = require('./routes/compras');
const proveedorRoutes = require('./routes/proveedores');
const reporteRoutes = require('./routes/reportes');
const cierreRoutes = require('./routes/cierres');
const insightRoutes = require('./routes/insights');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/compras', compraRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/cierres', cierreRoutes);
app.use('/api/insights', insightRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;
