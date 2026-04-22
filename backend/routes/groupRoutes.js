const express = require('express');
const router = express.Router();
const { createGroup, inviteMember, respondToInvite, enrollWithProfessor, getMyGroup, getAllGroups, leaveGroup } = require('../controllers/groupController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, requireRole('dean'), getAllGroups);
router.get('/my-group', protect, requireRole('student'), getMyGroup);
router.post('/', protect, requireRole('student'), createGroup);
router.post('/invite', protect, requireRole('student'), inviteMember);
router.post('/respond-invite', protect, requireRole('student'), respondToInvite);
router.post('/enroll', protect, requireRole('student'), enrollWithProfessor);
router.delete('/:groupId/leave', protect, requireRole('student'), leaveGroup);

module.exports = router;
