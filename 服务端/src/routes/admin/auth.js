const router = require('express').Router();
const ctrl = require('../../controllers/admin/authController');
const { validate } = require('../../middleware/validate');
const { authenticateAdmin } = require('../../middleware/auth');

router.post('/login', ctrl.loginValidation, validate, ctrl.login);
router.get('/info', authenticateAdmin, ctrl.getInfo);
router.post('/change-password', authenticateAdmin, ctrl.changePasswordValidation, validate, ctrl.changePassword);

module.exports = router;
