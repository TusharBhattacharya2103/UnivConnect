const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};
    if (role !== 'dean') query.$or = [{ targetAudience: 'all' }, { targetAudience: role === 'student' ? 'students' : 'professors' }];
    const now = new Date();
    query.$or = query.$or ? [...query.$or] : undefined;
    const announcements = await Announcement.find({
      ...query,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).populate('author', 'name role').sort({ pinned: -1, createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, requireRole('dean', 'professor'), async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, author: req.user._id });
    await announcement.populate('author', 'name role');
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', protect, requireRole('dean'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
