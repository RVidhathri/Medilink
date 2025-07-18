const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dietType: {
    type: String,
    required: true
  },
  healthConditions: [{
    type: String
  }],
  goal: {
    type: String,
    required: true
  },
  activityLevel: {
    type: String,
    required: true
  },
  breakfast: [{
    type: String
  }],
  lunch: [{
    type: String
  }],
  dinner: [{
    type: String
  }],
  snacks: [{
    type: String
  }],
  notes: {
    type: String
  },
  calorieSuggestion: {
    type: String
  },
  activityNote: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DietPlan', dietPlanSchema); 