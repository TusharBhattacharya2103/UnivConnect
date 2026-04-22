const Group = require('../models/Group');
const User = require('../models/User');
const ProfessorProfile = require('../models/ProfessorProfile');
const ChatRoom = require('../models/ChatRoom');

exports.createGroup = async (req, res) => {
  try {
    const { name, projectTitle, projectType, semester } = req.body;
    const existing = await Group.findOne({ members: req.user._id, enrollmentStatus: { $in: ['forming', 'pending_approval', 'enrolled'] } });
    if (existing) return res.status(400).json({ message: 'You are already in an active group' });

    const group = await Group.create({
      name, projectTitle, projectType, semester,
      leader: req.user._id,
      members: [req.user._id]
    });

    const chatRoom = await ChatRoom.create({
      type: 'group', name: `${name} - Team Chat`,
      participants: [req.user._id],
      group: group._id, createdBy: req.user._id
    });
    group.chatRoom = chatRoom._id;
    await group.save();

    await group.populate(['leader', 'members']);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.inviteMember = async (req, res) => {
  try {
    const { groupId, studentId, message } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group leader can invite' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });

    const alreadyInGroup = await Group.findOne({ members: studentId, enrollmentStatus: { $in: ['forming', 'pending_approval', 'enrolled'] } });
    if (alreadyInGroup) return res.status(400).json({ message: 'Student is already in a group' });

    const alreadyInvited = group.pendingInvites.find(i => i.student.toString() === studentId && i.status === 'pending');
    if (alreadyInvited) return res.status(400).json({ message: 'Invitation already sent' });

    group.pendingInvites.push({ student: studentId, invitedBy: req.user._id, message });
    await group.save();

    const inviteMsg = `${req.user.name} is requesting you to join group "${group.name}" for ${group.projectType} project${group.professor ? ' under Professor guidance' : ''}`;
    await User.findByIdAndUpdate(studentId, {
      $push: { notifications: { type: 'group_invite', message: inviteMsg, from: req.user._id, relatedId: group._id } }
    });

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.respondToInvite = async (req, res) => {
  try {
    const { groupId, action } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const invite = group.pendingInvites.find(i => i.student.toString() === req.user._id.toString() && i.status === 'pending');
    if (!invite) return res.status(404).json({ message: 'Invitation not found' });

    if (action === 'accept') {
      if (group.professor) {
        const profile = await ProfessorProfile.findOne({ user: group.professor });
        if (profile && group.members.length >= profile.maxGroupSize) {
          return res.status(400).json({ message: 'Group is at maximum capacity' });
        }
      }
      group.members.push(req.user._id);
      invite.status = 'accepted';
      await ChatRoom.findByIdAndUpdate(group.chatRoom, { $addToSet: { participants: req.user._id } });
    } else {
      invite.status = 'rejected';
    }
    await group.save();
    await group.populate(['leader', 'members', 'professor']);
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.enrollWithProfessor = async (req, res) => {
  try {
    const { groupId, professorId } = req.body;
    const group = await Group.findById(groupId).populate('members');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group leader can enroll' });
    }

    const profile = await ProfessorProfile.findOne({ user: professorId });
    if (!profile) return res.status(404).json({ message: 'Professor profile not found' });
    if (!profile.acceptingStudents) return res.status(400).json({ message: 'Professor is not accepting students' });
    if (group.members.length < profile.minGroupSize) {
      return res.status(400).json({ message: `Minimum group size is ${profile.minGroupSize}` });
    }
    if (group.members.length > profile.maxGroupSize) {
      return res.status(400).json({ message: `Maximum group size is ${profile.maxGroupSize}` });
    }
    if (profile.currentStudents + group.members.length > profile.maxStudents) {
      return res.status(400).json({ message: 'Professor has reached student capacity' });
    }

    group.professor = professorId;
    group.enrollmentStatus = 'pending_approval';
    group.enrollmentRequest.requestedAt = new Date();
    await group.save();

    await User.findByIdAndUpdate(professorId, {
      $push: { notifications: { type: 'enrollment_request', message: `Group "${group.name}" (${group.members.length} students) has requested to enroll under you`, from: req.user._id, relatedId: group._id } }
    });

    res.json({ message: 'Enrollment request sent to professor' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyGroup = async (req, res) => {
  try {
    const group = await Group.findOne({ members: req.user._id, enrollmentStatus: { $in: ['forming', 'pending_approval', 'enrolled'] } })
      .populate('members', 'name email rollNumber department')
      .populate('leader', 'name email')
      .populate('professor', 'name email department');
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name email rollNumber')
      .populate('leader', 'name email')
      .populate('professor', 'name email');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.leader.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Group leader cannot leave. Transfer leadership or disband the group.' });
    }
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    await ChatRoom.findByIdAndUpdate(group.chatRoom, { $pull: { participants: req.user._id } });
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
