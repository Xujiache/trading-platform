const router = require('express').Router();
const ctrl = require('../../controllers/mobile/authController');
const { validate } = require('../../middleware/validate');
const { authenticateToken } = require('../../middleware/auth');

router.post('/send-code', ctrl.sendCodeValidation, validate, ctrl.sendCode);
router.post('/register', ctrl.registerValidation, validate, ctrl.register);
router.post('/login', ctrl.loginValidation, validate, ctrl.login);
router.post('/reset-password', ctrl.resetPasswordValidation, validate, ctrl.resetPassword);
router.get('/profile', authenticateToken, ctrl.getProfile);

module.exports = router;
