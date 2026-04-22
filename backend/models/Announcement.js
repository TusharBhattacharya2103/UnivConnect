const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetAudience: { type: String, enum: ['all', 'students', 'professors'], default: 'all' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  pinned: { type: Boolean, default: false },
  expiresAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
