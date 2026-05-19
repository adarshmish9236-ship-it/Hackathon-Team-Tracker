// routes/milestones.js
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/milestonesController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get('/',          ctrl.getMilestones);
router.post('/',         ctrl.createMilestone);
router.patch('/:id/toggle', ctrl.toggleMilestone);

module.exports = router;
