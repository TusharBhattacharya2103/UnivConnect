const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const Group = require('../models/Group');
const User = require('../models/User');

exports.getChatRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ participants: req.user._id, isActive: true })
      .populate('participants', 'name email role')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name role' }
      })
      .populate('group', 'name projectTitle')
      .sort({ lastActivity: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Chat room not found' });

    if (!room.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ chatRoom: roomId, isDeleted: false })
      .populate('sender', 'name email role')
      .sort({ createdAt: 1 })
      .limit(100);

    await Message.updateMany(
      { chatRoom: roomId, 'readBy.user': { $ne: req.user._id } },
      { $addToSet: { readBy: { user: req.user._id } } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.participants.map(p => p.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      chatRoom: roomId,
      sender: req.user._id,
      content,
      readBy: [{ user: req.user._id }]
    });

    room.lastMessage = message._id;
    room.lastActivity = new Date();
    await room.save();

    await message.populate('sender', 'name email role');

    // Emit socket event so all room participants get the message in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProfessorGroupChat = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findById(groupId).populate('members');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.enrollmentStatus !== 'enrolled') {
      return res.status(400).json({ message: 'Group must be enrolled first' });
    }

    const isProfessor = group.professor.toString() === req.user._id.toString();
    const isMember = group.members.some(m => m._id.toString() === req.user._id.toString());
    if (!isProfessor && !isMember) return res.status(403).json({ message: 'Access denied' });

    const existingRoom = await ChatRoom.findOne({ group: groupId, type: 'professor_group' })
      .populate('participants', 'name email role');
    if (existingRoom) {
      // Ensure ALL current group members + professor are participants (sync membership)
      const allIds = [...group.members.map(m => m._id.toString()), group.professor.toString()];
      const existingIds = existingRoom.participants.map(p => p._id.toString());
      const missing = allIds.filter(id => !existingIds.includes(id));
      if (missing.length > 0) {
        existingRoom.participants.push(...missing);
        await existingRoom.save();
        await existingRoom.populate('participants', 'name email role');
      }
      return res.json(existingRoom);
    }

    const participants = [...group.members.map(m => m._id), group.professor];
    const room = await ChatRoom.create({
      type: 'professor_group',
      name: `${group.name} - Professor Chat`,
      participants,
      group: groupId,
      professor: group.professor,
      createdBy: req.user._id
    });
    await room.populate('participants', 'name email role');
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDirectChat = async (req, res) => {
  try {
    const { userId } = req.body;
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'student' || targetUser.role === 'student') {
      const group = await Group.findOne({
        members: { $all: [req.user._id, userId] },
        enrollmentStatus: 'enrolled'
      });
      if (!group) return res.status(403).json({ message: 'Direct messaging with professor requires enrollment' });
    }

    const existing = await ChatRoom.findOne({
      type: 'direct',
      participants: { $all: [req.user._id, userId], $size: 2 }
    }).populate('participants', 'name email role');
    if (existing) return res.json(existing);

    const room = await ChatRoom.create({
      type: 'direct',
      participants: [req.user._id, userId],
      createdBy: req.user._id
    });
    await room.populate('participants', 'name email role');
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
