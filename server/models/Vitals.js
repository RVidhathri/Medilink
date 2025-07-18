const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodPressure: {
    systolic: {
      type: Number,
      required: true,
      min: 60,
      max: 200
    },
    diastolic: {
      type: Number,
      required: true,
      min: 40,
      max: 120
    }
  },
  heartRate: {
    type: Number,
    required: true,
    min: 40,
    max: 200
  },
  temperature: {
    type: Number,
    required: true,
    min: 35,
    max: 42
  },
  oxygenLevel: {
    type: Number,
    required: true,
    min: 70,
    max: 100
  },
  glucoseLevel: {
    type: Number,
    required: true,
    min: 40,
    max: 400
  },
  assessment: {
    needsUrgentCare: {
      type: Boolean,
      required: true
    },
    needsAttention: {
      type: Boolean,
      required: true
    },
    concerns: [{
      type: String
    }],
    recommendations: [{
      type: String
    }]
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shareMethod: {
    type: String,
    enum: ['chat', 'email'],
  },
  recordedAt: {
    type: Date,
    default: Date.now
  },
  sharedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Vitals', vitalsSchema); 