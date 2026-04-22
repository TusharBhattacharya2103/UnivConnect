# UnivConnect 🎓

> A full-stack university project collaboration platform built with the MERN stack.

## Features

### Roles & Permissions

| Feature | Dean | Professor | Student |
|--------|------|-----------|---------|
| View all groups | ✅ | Own groups | Own group |
| Force-enroll groups | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Post announcements | ✅ | ✅ | ❌ |
| Approve enrollment requests | ❌ | ✅ | ❌ |
| Set group size limits | ❌ | ✅ | ❌ |
| Create groups | ❌ | ❌ | ✅ |
| Invite students | ❌ | ❌ | ✅ (Leader) |
| Enroll under professor | ❌ | ❌ | ✅ (Leader) |
| Chat (team + professor) | ✅ | ✅ | ✅ |

### Key Functionality

- **Group Formation**: Students create groups and invite classmates via request notifications
- **Professor Enrollment**: Group leaders send enrollment requests; professors approve/reject
- **Privacy**: Each group has a private channel with their professor — no cross-group visibility
- **Real-time Chat**: Socket.io powers live messaging with typing indicators and online status
- **Capacity Control**: Professors set min/max group size and total student cap
- **Dean Oversight**: Full visibility over all users, groups, and ability to force-enroll

---

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT
- **Frontend**: React 18, React Router v6, Axios, Socket.io-client, React Hot Toast
- **Styling**: Custom CSS design system (dark theme)

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd univconnect

# 2. Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Install all dependencies
npm install        # root (for concurrently)
cd backend && npm install
cd ../frontend && npm install
```

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/univconnect
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:3000
```

### Seed the Database

```bash
cd backend
node seed.js
```

This creates demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Dean | dean@univ.edu | dean123 |
| Professor | prof@univ.edu | prof123 |
| Professor | rkumar@univ.edu | prof123 |
| Student | student@univ.edu | student123 |
| Student | priya@univ.edu | student123 |
| Student | rahul@univ.edu | student123 |

### Run the App

```bash
# Run both simultaneously (from root)
npm run dev

# OR run separately:
cd backend && npm run dev    # http://localhost:5000
cd frontend && npm start     # http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |

### Groups
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/groups` | Student |
| GET | `/api/groups/my-group` | Student |
| POST | `/api/groups/invite` | Student (Leader) |
| POST | `/api/groups/respond-invite` | Student |
| POST | `/api/groups/enroll` | Student (Leader) |
| DELETE | `/api/groups/:id/leave` | Student |

### Professors
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/professors` | All |
| GET | `/api/professors/my-groups` | Professor |
| PATCH | `/api/professors/profile` | Professor |
| POST | `/api/professors/review-enrollment` | Professor |

### Messages
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/messages/rooms` | Auth |
| GET | `/api/messages/rooms/:roomId` | Auth (participant) |
| POST | `/api/messages/send` | Auth |
| POST | `/api/messages/rooms/professor-group` | Enrolled |
| POST | `/api/messages/rooms/direct` | Enrolled |

### Dean
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/dean/stats` | Dean |
| GET | `/api/dean/users` | Dean |
| PATCH | `/api/dean/users/:id/toggle-status` | Dean |
| GET | `/api/dean/groups` | Dean |
| POST | `/api/dean/groups/force-enroll` | Dean |

---

## Socket Events

| Event (emit) | Payload | Description |
|---|---|---|
| `join_room` | `roomId` | Join a chat room |
| `send_message` | `{roomId, content}` | Send a message |
| `typing` | `{roomId, isTyping}` | Broadcast typing status |

| Event (listen) | Description |
|---|---|
| `new_message` | New message in a room |
| `user_typing` | Someone is typing |
| `user_online` | Online/offline status |
| `message_notification` | New message notification |

---

## Project Structure

```
univconnect/
├── backend/
│   ├── config/         # Database config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── socket/         # Socket.io handler
│   ├── seed.js         # Database seeder
│   └── server.js       # Entry point
│
└── frontend/
    └── src/
        ├── contexts/   # Auth & Socket contexts
        ├── pages/      # Page components
        ├── components/ # Shared components
        ├── App.js      # Router
        └── index.css   # Global styles
```

---

## Additional Features to Add (Future)

- [ ] File/document sharing in chat
- [ ] Project milestone tracker
- [ ] Professor rating system
- [ ] Email notifications
- [ ] Export group reports (PDF)
- [ ] Admin analytics dashboard
- [ ] Group transfer requests
- [ ] Multiple semesters support
- [ ] Video call integration
