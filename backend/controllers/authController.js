const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ProfessorProfile = require('../models/ProfessorProfile');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (role === 'dean') return res.status(403).json({ message: 'Dean accounts are created by system admin' });
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, department, rollNumber });
    
    if (role === 'professor') {
      await ProfessorProfile.create({ user: user._id });
    }

    res.status(201).json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated. Contact dean.' });

    user.lastSeen = new Date();
    await user.save();

    res.json({
      _id: user._id, name: user.name, email: user.email, role: user.role,
      department: user.department, rollNumber: user.rollNumber,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
