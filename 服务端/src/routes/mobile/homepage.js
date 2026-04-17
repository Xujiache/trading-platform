const router = require('express').Router();
const ctrl = require('../../controllers/mobile/homepageController');

router.get('/splash-ad', ctrl.getSplashAd);

module.exports = router;
