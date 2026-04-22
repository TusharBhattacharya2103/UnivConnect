const express = require('express');
const router = express.Router();
const { getChatRooms, getMessages, sendMessage, createProfessorGroupChat, createDirectChat } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/rooms', protect, getChatRooms);
router.get('/rooms/:roomId', protect, getMessages);
router.post('/send', protect, sendMessage);
router.post('/rooms/professor-group', protect, createProfessorGroupChat);
router.post('/rooms/direct', protect, createDirectChat);

module.exports = router;
