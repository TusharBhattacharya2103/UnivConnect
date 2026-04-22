const mongoose = require('mongoose');

const professorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  maxStudents: { type: Number, default: 50 },
  currentStudents: { type: Number, default: 0 },
  minGroupSize: { type: Number, default: 3 },
  maxGroupSize: { type: Number, default: 5 },
  acceptingStudents: { type: Boolean, default: true },
  specialization: { type: String, default: '' },
  bio: { type: String, default: '' },
  projectTypes: [{ type: String }],
  officeHours: { type: String, default: '' },
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
  semester: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ProfessorProfile', professorProfileSchema);
