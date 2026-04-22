const express = require('express');
const router = express.Router();
const { getStudents, getNotifications, markNotificationRead, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/students', protect, getStudents);
router.get('/notifications', protect, getNotifications);
router.patch('/notifications/:notifId/read', protect, markNotificationRead);
router.patch('/profile', protect, updateProfile);

module.exports = router;
