const router = require('express').Router();
const ctrl = require('../../controllers/mobile/homepageController');

router.get('/:key', ctrl.getContent);

module.exports = router;
