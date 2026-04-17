const router = require('express').Router();
const ctrl = require('../../controllers/admin/roleController');
const { validate } = require('../../middleware/validate');
const { authenticateAdmin } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');
const { logOperation } = require('../../middleware/operationLog');

router.use(authenticateAdmin);

router.get('/roles', ctrl.list);
router.get('/roles/:id', ctrl.detail);
router.post('/roles', checkPermission('admin:manage'), logOperation('角色管理', '创建角色'), ctrl.createValidation, validate, ctrl.create);
router.put('/roles/:id', checkPermission('admin:manage'), logOperation('角色管理', '更新角色'), ctrl.updateValidation, validate, ctrl.update);
router.delete('/roles/:id', checkPermission('admin:manage'), logOperation('角色管理', '删除角色'), ctrl.remove);

module.exports = router;
