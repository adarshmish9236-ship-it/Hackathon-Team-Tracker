// routes/tasks.js
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/taskController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get ('/',         ctrl.getTasks);
router.post('/',         ctrl.createTask);
router.put ('/:id',      ctrl.updateTask);
router.delete('/:id',   ctrl.deleteTask);
router.patch('/:id/move', ctrl.moveTask);

module.exports = router;
