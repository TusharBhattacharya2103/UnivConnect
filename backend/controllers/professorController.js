const ProfessorProfile = require('../models/ProfessorProfile');
const User = require('../models/User');
const Group = require('../models/Group');
const ChatRoom = require('../models/ChatRoom');

exports.getAllProfessors = async (req, res) => {
  try {
    const professors = await User.find({ role: 'professor', isActive: true }).select('-password');
    const profiles = await ProfessorProfile.find({ user: { $in: professors.map(p => p._id) } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });
    const result = professors.map(prof => ({
      ...prof.toObject(),
      profile: profileMap[prof._id.toString()] || null
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfessorProfile = async (req, res) => {
  try {
    const prof = await User.findById(req.params.id).select('-password');
    if (!prof || prof.role !== 'professor') return res.status(404).json({ message: 'Professor not found' });
    const profile = await ProfessorProfile.findOne({ user: prof._id }).populate('groups');
    res.json({ ...prof.toObject(), profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { maxStudents, minGroupSize, maxGroupSize, acceptingStudents, specialization, bio, projectTypes, officeHours, semester } = req.body;
    const profile = await ProfessorProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (maxStudents !== undefined) profile.maxStudents = maxStudents;
    if (minGroupSize !== undefined) profile.minGroupSize = minGroupSize;
    if (maxGroupSize !== undefined) profile.maxGroupSize = maxGroupSize;
    if (acceptingStudents !== undefined) profile.acceptingStudents = acceptingStudents;
    if (specialization !== undefined) profile.specialization = specialization;
    if (bio !== undefined) profile.bio = bio;
    if (projectTypes !== undefined) profile.projectTypes = projectTypes;
    if (officeHours !== undefined) profile.officeHours = officeHours;
    if (semester !== undefined) profile.semester = semester;

    await profile.save();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfessorGroups = async (req, res) => {
  try {
    const groups = await Group.find({ professor: req.user._id })
      .populate('members', 'name email rollNumber')
      .populate('leader', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reviewEnrollment = async (req, res) => {
  try {
    const { groupId, action, notes } = req.body;
    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.professor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (action === 'approve') {
      group.enrollmentStatus = 'enrolled';
      const profile = await ProfessorProfile.findOne({ user: req.user._id });
      profile.currentStudents += group.members.length;
      await profile.save();

      // Auto-create or update the professor_group chat room with ALL members + professor
      const allParticipants = [...group.members.map(m => m._id), req.user._id];
      let chatRoom = await ChatRoom.findOne({ group: group._id, type: 'professor_group' });
      if (chatRoom) {
        // Ensure everyone is in the room
        chatRoom.participants = allParticipants;
        await chatRoom.save();
      } else {
        chatRoom = await ChatRoom.create({
          type: 'professor_group',
          name: `${group.name} - Professor Chat`,
          participants: allParticipants,
          group: group._id,
          professor: req.user._id,
          createdBy: req.user._id
        });
      }

      // Notify all students that the group chat is now available
      const notifMsg = `Your group "${group.name}" has been enrolled! You can now chat with your team and professor.`;
      await User.updateMany(
        { _id: { $in: group.members.map(m => m._id) } },
        { $push: { notifications: { type: 'enrollment_approved', message: notifMsg, from: req.user._id, relatedId: group._id } } }
      );
    } else {
      group.enrollmentStatus = 'rejected';
      group.professor = null;

      // Notify all students of rejection
      const rejectMsg = `Your enrollment request for group "${group.name}" was rejected.${notes ? ` Reason: ${notes}` : ''}`;
      await User.updateMany(
        { _id: { $in: group.members.map(m => m._id) } },
        { $push: { notifications: { type: 'enrollment_rejected', message: rejectMsg, from: req.user._id, relatedId: group._id } } }
      );
    }
    group.enrollmentRequest.reviewedAt = new Date();
    group.enrollmentRequest.notes = notes;
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
