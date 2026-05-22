// routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get ('/me',       auth, ctrl.me);
router.get ('/my-tasks', auth, ctrl.getMyTasks);
router.get ('/audit-logs', auth, ctrl.getAuditLogs);
router.post('/logout',   auth, ctrl.logout);
router.put ('/profile',  auth, ctrl.updateProfile);
router.get ('/notifications', auth, ctrl.getNotifications);
router.post('/notifications/read', auth, ctrl.markNotificationsRead);

module.exports = router;
