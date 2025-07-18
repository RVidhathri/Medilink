import React, { useState } from 'react';
import axios from 'axios';
import { 
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';

const VitalsForm = () => {
  const [formData, setFormData] = useState({
    bloodPressure: {
      systolic: '',
      diastolic: ''
    },
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    glucoseLevel: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateVitals = (vitals) => {
    const limits = {
      systolic: { min: 60, max: 200 },
      diastolic: { min: 40, max: 120 },
      heartRate: { min: 40, max: 200 },
      temperature: { min: 35, max: 42 },
      oxygenLevel: { min: 70, max: 100 },
      glucoseLevel: { min: 40, max: 400 }
    };

    const errors = [];
    
    if (vitals.bloodPressure.systolic < limits.systolic.min || vitals.bloodPressure.systolic > limits.systolic.max) {
      errors.push('Invalid systolic blood pressure');
    }
    if (vitals.bloodPressure.diastolic < limits.diastolic.min || vitals.bloodPressure.diastolic > limits.diastolic.max) {
      errors.push('Invalid diastolic blood pressure');
    }
    if (vitals.heartRate < limits.heartRate.min || vitals.heartRate > limits.heartRate.max) {
      errors.push('Invalid heart rate');
    }
    if (vitals.temperature < limits.temperature.min || vitals.temperature > limits.temperature.max) {
      errors.push('Invalid temperature');
    }
    if (vitals.oxygenLevel < limits.oxygenLevel.min || vitals.oxygenLevel > limits.oxygenLevel.max) {
      errors.push('Invalid oxygen level');
    }
    if (vitals.glucoseLevel < limits.glucoseLevel.min || vitals.glucoseLevel > limits.glucoseLevel.max) {
      errors.push('Invalid glucose level');
    }

    return errors;
  };

  const assessVitals = (vitals) => {
    const concerns = [];
    const recommendations = [];
    let needsUrgentCare = false;
    let needsAttention = false;

    // Blood pressure assessment
    if (vitals.bloodPressure.systolic >= 180 || vitals.bloodPressure.diastolic >= 110) {
      concerns.push('Hypertensive crisis');
      recommendations.push('Seek emergency medical care');
      needsUrgentCare = true;
    } else if (vitals.bloodPressure.systolic >= 140 || vitals.bloodPressure.diastolic >= 90) {
      concerns.push('High blood pressure');
      recommendations.push('Schedule appointment with healthcare provider');
      needsAttention = true;
    }

    // Heart rate assessment
    if (vitals.heartRate >= 120) {
      concerns.push('Elevated heart rate');
      recommendations.push('Rest and monitor heart rate');
      needsAttention = true;
    } else if (vitals.heartRate <= 50) {
      concerns.push('Low heart rate');
      recommendations.push('Consult healthcare provider');
      needsAttention = true;
    }

    // Temperature assessment
    if (vitals.temperature >= 39) {
      concerns.push('High fever');
      recommendations.push('Take fever medication and seek medical attention');
      needsUrgentCare = true;
    } else if (vitals.temperature >= 37.8) {
      concerns.push('Mild fever');
      recommendations.push('Monitor temperature and rest');
      needsAttention = true;
    }

    // Oxygen level assessment
    if (vitals.oxygenLevel <= 90) {
      concerns.push('Low oxygen saturation');
      recommendations.push('Seek immediate medical attention');
      needsUrgentCare = true;
    } else if (vitals.oxygenLevel <= 94) {
      concerns.push('Below normal oxygen level');
      recommendations.push('Monitor oxygen levels closely');
      needsAttention = true;
    }

    // Glucose level assessment
    if (vitals.glucoseLevel >= 300) {
      concerns.push('High blood sugar');
      recommendations.push('Take insulin as prescribed and contact healthcare provider');
      needsUrgentCare = true;
    } else if (vitals.glucoseLevel <= 70) {
      concerns.push('Low blood sugar');
      recommendations.push('Consume fast-acting carbohydrates and monitor levels');
      needsUrgentCare = true;
    }

    return {
      needsUrgentCare,
      needsAttention,
      concerns,
      recommendations
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('bloodPressure')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bloodPressure: {
          ...prev.bloodPressure,
          [key]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Convert string values to numbers
    const numericFormData = {
      bloodPressure: {
        systolic: Number(formData.bloodPressure.systolic),
        diastolic: Number(formData.bloodPressure.diastolic)
      },
      heartRate: Number(formData.heartRate),
      temperature: Number(formData.temperature),
      oxygenLevel: Number(formData.oxygenLevel),
      glucoseLevel: Number(formData.glucoseLevel)
    };

    const validationErrors = validateVitals(numericFormData);
    
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      setLoading(false);
      return;
    }

    // Get assessment
    const assessment = assessVitals(numericFormData);

    try {
      // Get userId from localStorage or your auth context
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await axios.post('/api/vitals', {
        userId,
        vitals: numericFormData,
        assessment
      });

      setSuccess(true);
      setFormData({
        bloodPressure: { systolic: '', diastolic: '' },
        heartRate: '',
        temperature: '',
        oxygenLevel: '',
        glucoseLevel: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Record Vitals
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Vitals recorded successfully!</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Systolic BP (mmHg)"
              name="bloodPressure.systolic"
              type="number"
              value={formData.bloodPressure.systolic}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Diastolic BP (mmHg)"
              name="bloodPressure.diastolic"
              type="number"
              value={formData.bloodPressure.diastolic}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Heart Rate (bpm)"
              name="heartRate"
              type="number"
              value={formData.heartRate}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Temperature (°C)"
              name="temperature"
              type="number"
              value={formData.temperature}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Oxygen Level (%)"
              name="oxygenLevel"
              type="number"
              value={formData.oxygenLevel}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Glucose Level (mg/dL)"
              name="glucoseLevel"
              type="number"
              value={formData.glucoseLevel}
              onChange={handleChange}
              required
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 200 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Record Vitals'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default VitalsForm; 