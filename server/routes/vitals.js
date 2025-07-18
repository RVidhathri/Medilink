const express = require('express');
const router = express.Router();
const Vitals = require('../models/Vitals');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

// Record vitals
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, vitals, assessment } = req.body;

    const newVitals = new Vitals({
      patientId: userId,
      bloodPressure: {
        systolic: vitals.bloodPressure.systolic,
        diastolic: vitals.bloodPressure.diastolic
      },
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenLevel: vitals.oxygenLevel,
      glucoseLevel: vitals.glucoseLevel,
      assessment: {
        needsUrgentCare: assessment.needsUrgentCare,
        needsAttention: assessment.needsAttention,
        concerns: assessment.concerns,
        recommendations: assessment.recommendations
      },
      recordedAt: new Date()
    });

    await newVitals.save();

    // If urgent care is needed, notify connected doctors
    if (assessment.needsUrgentCare) {
      // Implementation for doctor notification would go here
    }

    res.status(201).json({
      success: true,
      data: newVitals
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vitals',
      error: error.message
    });
  }
});

// Get patient's vitals history
router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const vitals = await Vitals.find({ patientId: req.params.patientId })
      .sort({ recordedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: vitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vitals history',
      error: error.message
    });
  }
});

// Share vitals with doctor
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const { userId, vitals, assessment, shareMethod, doctorId } = req.body;

    // Verify doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Create a shared vitals record
    const sharedVitals = new Vitals({
      patientId: userId,
      sharedWith: doctorId,
      bloodPressure: {
        systolic: vitals.bloodPressure.systolic,
        diastolic: vitals.bloodPressure.diastolic
      },
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenLevel: vitals.oxygenLevel,
      glucoseLevel: vitals.glucoseLevel,
      assessment: {
        needsUrgentCare: assessment.needsUrgentCare,
        needsAttention: assessment.needsAttention,
        concerns: assessment.concerns,
        recommendations: assessment.recommendations
      },
      shareMethod,
      sharedAt: new Date()
    });

    await sharedVitals.save();

    // If sharing via chat, create a chat message
    if (shareMethod === 'chat') {
      // Implementation for chat message creation would go here
    }

    res.status(200).json({
      success: true,
      message: 'Vitals shared successfully',
      data: sharedVitals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to share vitals',
      error: error.message
    });
  }
});

module.exports = router; 