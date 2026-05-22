const router = require('express').Router();
const { listar, generarAhora } = require('../controllers/insightController');
const { auth } = require('../middleware/auth');

router.get('/', auth, listar);
router.post('/generar', auth, generarAhora);

module.exports = router;
