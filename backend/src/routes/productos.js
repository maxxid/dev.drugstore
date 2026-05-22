const router = require('express').Router();
const {
  listar, obtener, crear, actualizar, eliminar, buscarPorCodigo, validateProducto,
} = require('../controllers/productoController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.get('/codigo/:codigo', auth, buscarPorCodigo);
router.get('/:id', auth, obtener);
router.post('/', auth, validateProducto, crear);
router.put('/:id', auth, actualizar);
router.delete('/:id', auth, eliminar);

module.exports = router;
