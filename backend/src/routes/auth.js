const router = require('express').Router();
const { register, login, me, validateRegister, validateLogin } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', auth, me);

module.exports = router;
