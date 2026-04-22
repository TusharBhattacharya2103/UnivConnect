const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, toggleUserStatus, getAllGroupsAdmin, forceEnroll } = require('../controllers/deanController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.use(protect, requireRole('dean'));
router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/groups', getAllGroupsAdmin);
router.post('/groups/force-enroll', forceEnroll);

module.exports = router;
