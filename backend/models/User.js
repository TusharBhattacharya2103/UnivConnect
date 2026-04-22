const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['dean', 'professor', 'student'], required: true },
  avatar: { type: String, default: '' },
  department: { type: String, default: '' },
  rollNumber: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  notifications: [{
    type: { type: String },
    message: { type: String },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
