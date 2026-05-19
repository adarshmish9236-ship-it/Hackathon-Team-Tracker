// routes/polls.js
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/pollController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/',                    ctrl.getPolls);
router.post('/',                   ctrl.createPoll);
router.post('/:poll_id/vote',      ctrl.vote);
router.get('/notifications',       ctrl.getNotifications);
router.post('/notifications/read', ctrl.markRead);
router.post('/sos',                ctrl.triggerSOS);
router.get('/sos',                 ctrl.getSOSAlerts);
router.patch('/sos/:id/resolve',   ctrl.resolveSOSAlert);

module.exports = router;
