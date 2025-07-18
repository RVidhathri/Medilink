const mongoose = require('mongoose');

const pregnancyTrackerSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lmpDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  currentWeek: {
    type: Number
  },
  trimester: {
    type: Number
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  milestones: {
    firstUltrasound: String,
    geneticTesting: String,
    genderReveal: String,
    glucoseTest: String,
    groupBStrep: String
  },
  checkups: [{
    date: Date,
    notes: String,
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  symptoms: [{
    date: Date,
    type: String,
    severity: { type: Number, min: 1, max: 10 }
  }],
  weightLog: [{
    date: Date,
    weight: Number
  }]
});

module.exports = mongoose.model('PregnancyTracker', pregnancyTrackerSchema); 