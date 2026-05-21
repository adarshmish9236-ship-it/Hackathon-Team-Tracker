// routes/admin.js — God-Level Admin specific routes
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { auth, adminOnly } = require('../middleware/auth');

// Apply auth and adminOnly middleware to all routes in this router
router.use(auth, adminOnly);

// User Management
router.get('/users', ctrl.getAllUsers);
router.put('/users/:id/role', ctrl.updateUserRole);
router.delete('/users/:id', ctrl.deleteUser);

// Team Management
router.get('/teams', ctrl.getAllTeams);
router.delete('/teams/:id', ctrl.deleteTeam);

// God-Level Telemetry & Data
router.get('/telemetry', ctrl.getTelemetry);
router.get('/threats', ctrl.getThreats);
router.get('/database', ctrl.getDatabaseStats);

// Settings
router.get('/settings', ctrl.getSettings);
router.put('/settings', ctrl.updateSetting);

// Broadcast
router.post('/broadcast', ctrl.broadcast);

module.exports = router;
