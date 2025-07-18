const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function() { return this.isNew; },
    unique: true,
  },
  password: {
    type: String,
    required: function() { return this.isNew; },
  },
  name: {
    type: String,
    required: function() { return this.isNew; },
  },
  role: {
    type: String,
    required: function() { return this.isNew; },
    enum: ['doctor', 'patient'],
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  specialization: {
    type: String,
    required: function() { return this.isNew && this.role === 'doctor'; }
  },
  experience: {
    type: Number,
  },
  education: {
    type: String,
  },
  languages: {
    type: [String],
    default: [],
  },
  bio: {
    type: String,
  },
  age: {
    type: Number,
  },
  connectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  healthRecords: [{
    title: String,
    condition: String,
    diagnosis: String,
    description: String,
    date: { type: Date, default: Date.now },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  hasActiveChat: {
    type: Boolean,
    default: false
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema); 