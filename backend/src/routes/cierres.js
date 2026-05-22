const router = require('express').Router();
const { cerrarCaja, listar } = require('../controllers/cierreCajaController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.post('/', auth, cerrarCaja);

module.exports = router;
