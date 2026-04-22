const express = require('express');
const router = express.Router();
const { getAllProfessors, getProfessorProfile, updateProfile, getProfessorGroups, reviewEnrollment } = require('../controllers/professorController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, getAllProfessors);
router.get('/my-groups', protect, requireRole('professor'), getProfessorGroups);
router.get('/:id', protect, getProfessorProfile);
router.patch('/profile', protect, requireRole('professor'), updateProfile);
router.post('/review-enrollment', protect, requireRole('professor'), reviewEnrollment);

module.exports = router;
