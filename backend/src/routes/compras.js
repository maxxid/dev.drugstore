const router = require('express').Router();
const { crear, listar, obtener, validateCompra } = require('../controllers/compraController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.get('/:id', auth, obtener);
router.post('/', auth, validateCompra, crear);

module.exports = router;
