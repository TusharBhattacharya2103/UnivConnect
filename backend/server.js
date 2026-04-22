require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSocket } = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      const allowed = [
        process.env.CLIENT_URL,
        'http://localhost:3000'
      ];
      if (!origin || allowed.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      process.env.CLIENT_URL,
      'http://localhost:3000'
    ];
    if (!origin || allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Attach io to app so controllers can emit socket events
app.set('io', io);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/professors', require('./routes/professorRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/dean', require('./routes/deanRoutes'));

initSocket(io);

app.get('/api/health', (req, res) => res.json({ status: 'UnivConnect API Running' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
