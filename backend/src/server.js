const app = require('./app');
const { sequelize, Rol, MetodoPago, Usuario } = require('./models');

const PORT = process.env.PORT || 3001;

async function seed() {
  const roles = await Rol.findAll();
  if (roles.length === 0) {
    await Rol.bulkCreate([
      { nombre: 'admin' },
      { nombre: 'vendedor' },
    ]);
  }

  const metodos = await MetodoPago.findAll();
  if (metodos.length === 0) {
    await MetodoPago.bulkCreate([
      { nombre: 'Efectivo' },
      { nombre: 'Tarjeta' },
      { nombre: 'Transferencia' },
    ]);
  }

  const admin = await Usuario.findOne({ where: { email: 'admin@kiosko.com' } });
  if (!admin) {
    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@kiosko.com',
      password_hash: 'admin123',
      rol_id: 1,
    });
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Base de datos conectada');

    await sequelize.sync({ alter: true });
    console.log('Tablas sincronizadas');

    await seed();
    console.log('Datos iniciales cargados');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
}

start();
