const router = require('express').Router();
const ctrl = require('../../controllers/admin/logController');
const { authenticateAdmin } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');

router.use(authenticateAdmin);

router.get('/logs', checkPermission('system:audit'), ctrl.list);
router.get('/logs/modules', checkPermission('system:audit'), ctrl.modules);
router.get('/logs/:id', checkPermission('system:audit'), ctrl.detail);

module.exports = router;
