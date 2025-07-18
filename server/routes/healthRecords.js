const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');

// Get health records for a patient
router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { role, userId } = req.user;

    // Verify access rights
    if (role !== 'admin' && role !== 'doctor' && userId !== patientId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const records = await HealthRecord.find({ patientId })
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy', 'name role')
      .populate('updatedBy', 'name role');

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health records',
      error: error.message
    });
  }
});

// Create a new health record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { patientId, ...recordData } = req.body;

    // Only doctors and admins can create records
    if (role !== 'admin' && role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and admins can create health records'
      });
    }

    const newRecord = new HealthRecord({
      ...recordData,
      patientId,
      createdBy: userId,
      date: new Date(recordData.date)
    });

    await newRecord.save();

    res.status(201).json({
      success: true,
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating health record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create health record',
      error: error.message
    });
  }
});

// Update a health record
router.put('/:recordId', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { recordId } = req.params;
    const updateData = req.body;

    // Only doctors and admins can update records
    if (role !== 'admin' && role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and admins can update health records'
      });
    }

    const record = await HealthRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    // Update the record
    Object.assign(record, {
      ...updateData,
      updatedBy: userId,
      updatedAt: new Date(),
      date: new Date(updateData.date)
    });

    await record.save();

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error updating health record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health record',
      error: error.message
    });
  }
});

// Delete a health record
router.delete('/:recordId', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;
    const { recordId } = req.params;

    // Only admins can delete records
    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete health records'
      });
    }

    const record = await HealthRecord.findByIdAndDelete(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting health record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete health record',
      error: error.message
    });
  }
});

// Share a health record with connected doctors
router.post('/:recordId/share', authenticateToken, async (req, res) => {
  try {
    const record = await HealthRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    // Check if the user is authorized to share this record
    if (record.patientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this record' });
    }

    // Find all connected doctors for this patient
    const patient = await User.findById(req.user.id);
    const connectedDoctors = await User.find({
      _id: { $in: patient.connectedUsers },
      role: 'doctor'
    });

    // Add doctors to the sharedWith array if they're not already included
    const updatedSharedWith = [...new Set([
      ...record.sharedWith,
      ...connectedDoctors.map(doctor => doctor._id)
    ])];

    record.sharedWith = updatedSharedWith;
    await record.save();

    res.json({ message: 'Health record shared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error sharing health record' });
  }
});

module.exports = router; 