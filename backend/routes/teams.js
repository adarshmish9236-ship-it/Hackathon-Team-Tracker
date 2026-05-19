// routes/teams.js
const router = require('express').Router();
const ctrl   = require('../controllers/teamController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.post('/',                       ctrl.createTeam);
router.post('/join',                   ctrl.joinTeam);
router.get ('/my',                     ctrl.getMyTeams);
router.get ('/:id',                    ctrl.getTeam);
router.put ('/:id',                    ctrl.updateTeam);
router.get ('/:team_id/leaderboard',   ctrl.getLeaderboard);
router.put ('/:team_id/members/:user_id/role', ctrl.updateMemberRole);

module.exports = router;
