const router = require('express').Router();
const ctrl = require('../../controllers/admin/configController');
const { validate } = require('../../middleware/validate');
const { authenticateAdmin } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');
const { logOperation } = require('../../middleware/operationLog');

router.use(authenticateAdmin);

router.get('/config', ctrl.list);
router.get('/config/categories', ctrl.categories);
router.put('/config/batch', checkPermission('system:config'), logOperation('系统配置', '批量更新'), ctrl.batchUpdate);
router.get('/config/email', ctrl.getEmailConfig);
router.put('/config/email', checkPermission('system:config'), logOperation('系统配置', '更新邮箱配置'), ctrl.updateEmailConfig);
router.post('/config/email/test', checkPermission('system:config'), ctrl.testEmailValidation, validate, ctrl.testEmail);
router.put('/config/:id', checkPermission('system:config'), logOperation('系统配置', '更新配置'), ctrl.update);

module.exports = router;
