const router = require('express').Router();
const { listar, crear, actualizar, eliminar, validateProveedor } = require('../controllers/proveedorController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.post('/', auth, validateProveedor, crear);
router.put('/:id', auth, actualizar);
router.delete('/:id', auth, eliminar);

module.exports = router;
