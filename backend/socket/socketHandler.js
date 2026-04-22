const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

const onlineUsers = new Map();

const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    io.emit('user_online', { userId, online: true });

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    // Note: Message sending is handled via REST API (messageController.sendMessage)
    // which then emits 'new_message' to the room via io.to(roomId).emit().
    // This socket handler is kept for any legacy/direct socket sends but
    // the primary flow is REST -> socket emit.
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content } = data;
        const room = await ChatRoom.findById(roomId);
        if (!room || !room.participants.map(p => p.toString()).includes(userId)) return;

        const message = await Message.create({
          chatRoom: roomId, sender: socket.user._id, content,
          readBy: [{ user: socket.user._id }]
        });
        room.lastMessage = message._id;
        room.lastActivity = new Date();
        await room.save();

        await message.populate('sender', 'name email role');
        io.to(roomId).emit('new_message', message);

        // Notify offline participants
        room.participants.forEach(participantId => {
          const pid = participantId.toString();
          if (pid !== userId) {
            const socketId = onlineUsers.get(pid);
            if (socketId) {
              io.to(socketId).emit('message_notification', {
                roomId, message, from: socket.user.name
              });
            }
          }
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ roomId, isTyping }) => {
      socket.to(roomId).emit('user_typing', { userId, name: socket.user.name, isTyping });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_online', { userId, online: false });
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec();
    });
  });
};

module.exports = { initSocket };
