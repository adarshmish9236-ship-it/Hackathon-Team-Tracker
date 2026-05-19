// routes/analytics.js
const router = require('express').Router();
const ctrl   = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/:team_id',                        ctrl.getTeamAnalytics);
router.get('/:team_id/insights',               ctrl.getAIInsights);
router.get('/:team_id/user/:user_id',          ctrl.getUserActivity);
router.post('/:team_id/user/:user_id/calc',    ctrl.calcProductivity);

module.exports = router;
