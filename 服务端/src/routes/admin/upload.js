const router = require('express').Router();
const ctrl = require('../../controllers/admin/uploadController');
const { authenticateAdmin } = require('../../middleware/auth');

router.use(authenticateAdmin);

router.post('/upload/image', ...ctrl.uploadImage);
router.post('/upload/banner', ...ctrl.uploadBanner);

module.exports = router;
