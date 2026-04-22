const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  projectTitle: { type: String, default: '' },
  projectType: { type: String, enum: ['major', 'minor', 'research', 'other'], default: 'major' },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingInvites: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  professor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  enrollmentStatus: { type: String, enum: ['forming', 'pending_approval', 'enrolled', 'rejected'], default: 'forming' },
  enrollmentRequest: {
    requestedAt: Date,
    reviewedAt: Date,
    notes: String
  },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  isActive: { type: Boolean, default: true },
  semester: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);
