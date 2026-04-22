const User = require('../models/User');
const Group = require('../models/Group');
const ProfessorProfile = require('../models/ProfessorProfile');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalProfessors, totalGroups, enrolledGroups] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'professor' }),
      Group.countDocuments(),
      Group.countDocuments({ enrollmentStatus: 'enrolled' })
    ]);
    const pendingGroups = await Group.countDocuments({ enrollmentStatus: 'pending_approval' });
    const recentGroups = await Group.find().sort({ createdAt: -1 }).limit(5)
      .populate('leader', 'name').populate('professor', 'name');
    res.json({ totalStudents, totalProfessors, totalGroups, enrolledGroups, pendingGroups, recentGroups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'dean') return res.status(403).json({ message: 'Cannot modify dean account' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ message: `User ${user.isActive ? 'activated' : 'deactivated'}`, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDeanAccount = async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'dean' });
    if (exists) return res.status(400).json({ message: 'Dean account already exists' });
    const dean = await User.create({ ...req.body, role: 'dean' });
    res.status(201).json(dean);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllGroupsAdmin = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name email rollNumber')
      .populate('leader', 'name email')
      .populate('professor', 'name email department')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forceEnroll = async (req, res) => {
  try {
    const { groupId, professorId } = req.body;
    const group = await Group.findById(groupId);
    const profile = await ProfessorProfile.findOne({ user: professorId });
    group.professor = professorId;
    group.enrollmentStatus = 'enrolled';
    profile.currentStudents += group.members.length;
    await group.save();
    await profile.save();
    res.json({ message: 'Group force enrolled by dean' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
