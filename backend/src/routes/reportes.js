const router = require('express').Router();
const { resumenVentas, stockBajo, resumenDiario } = require('../controllers/reporteController');
const { auth } = require('../middleware/auth');

router.get('/ventas', auth, resumenVentas);
router.get('/stock-bajo', auth, stockBajo);
router.get('/diario', auth, resumenDiario);

module.exports = router;
