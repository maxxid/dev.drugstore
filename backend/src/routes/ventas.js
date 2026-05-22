const router = require('express').Router();
const { crear, listar, obtener, validateVenta } = require('../controllers/ventaController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.get('/:id', auth, obtener);
router.post('/', auth, validateVenta, crear);

module.exports = router;
