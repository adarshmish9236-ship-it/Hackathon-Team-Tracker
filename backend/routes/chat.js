// routes/chat.js
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

router.use(auth);
router.get ('/',                ctrl.getMessages);
router.post('/',                ctrl.sendMessage);
router.post('/:id/react',       ctrl.addReaction);
router.patch('/:id/pin',        ctrl.pinMessage);
router.get ('/sentiment',       ctrl.getSentimentStats);

module.exports = router;
