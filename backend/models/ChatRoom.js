const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group', 'professor_group'], required: true },
  name: { type: String, default: '' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
