const express = require('express');
const router = express.Router();
const PregnancyTracker = require('../models/PregnancyTracker');
const auth = require('../middleware/auth');

// Create pregnancy tracker entry
router.post('/api/pregnancy-tracker', auth, async (req, res) => {
  try {
    const tracker = new PregnancyTracker(req.body);
    await tracker.save();
    res.status(201).json(tracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get pregnancy tracker for a patient
router.get('/api/pregnancy-tracker/:patientId', auth, async (req, res) => {
  try {
    const tracker = await PregnancyTracker.findOne({ patientId: req.params.patientId });
    if (!tracker) {
      return res.status(404).json({ message: 'No pregnancy tracker found for this patient' });
    }
    res.json(tracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate pregnancy details
router.post('/calculate', auth, async (req, res) => {
  try {
    const { lmpDate } = req.body;
    
    // Parse the LMP date
    const lmp = new Date(lmpDate);
    const today = new Date();
    
    // Validate LMP date
    if (isNaN(lmp.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    if (lmp > today) {
      return res.status(400).json({ message: 'Last Menstrual Period date cannot be in the future' });
    }
    
    // Calculate estimated due date (EDD) - 280 days from LMP
    const edd = new Date(lmp);
    edd.setDate(lmp.getDate() + 280);
    
    // Calculate current week of pregnancy
    const pregnancyDays = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
    
    if (pregnancyDays < 0) {
      return res.status(400).json({ message: 'Invalid pregnancy duration. Please check the date.' });
    }
    
    const currentWeek = Math.floor(pregnancyDays / 7);
    
    // Calculate trimester
    let trimester;
    if (currentWeek < 13) {
      trimester = 1;
    } else if (currentWeek < 27) {
      trimester = 2;
    } else {
      trimester = 3;
    }
    
    // Prepare pregnancy information
    const pregnancyInfo = {
      lmpDate: lmp,
      dueDate: edd,
      currentWeek,
      trimester,
      daysPregnant: pregnancyDays,
      milestones: {
        firstUltrasound: '8-14 weeks',
        geneticTesting: '10-13 weeks',
        genderReveal: '18-22 weeks',
        glucoseTest: '24-28 weeks',
        groupBStrep: '36 weeks'
      }
    };
    
    res.json(pregnancyInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST route to track pregnancy details
router.post('/track', auth, async (req, res) => {
    try {
        const { 
            lastPeriodDate, 
            currentWeek, 
            symptoms, 
            weight, 
            bloodPressure, 
            fetalMovement,
            notes 
        } = req.body;

        // Validate required fields
        if (!lastPeriodDate || !currentWeek) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Calculate important dates and milestones
        const pregnancyInfo = calculatePregnancyInfo(lastPeriodDate);
        
        // Generate recommendations based on current week
        const weeklyRecommendations = getWeeklyRecommendations(currentWeek);

        // Generate health alerts if any
        const healthAlerts = generateHealthAlerts({
            currentWeek,
            symptoms,
            weight,
            bloodPressure
        });

        res.json({
            success: true,
            pregnancyInfo,
            weeklyRecommendations,
            healthAlerts
        });
    } catch (error) {
        console.error('Error tracking pregnancy:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

function calculatePregnancyInfo(lastPeriodDate) {
    const lmpDate = new Date(lastPeriodDate);
    
    // Calculate due date (40 weeks from LMP)
    const dueDate = new Date(lmpDate);
    dueDate.setDate(dueDate.getDate() + 280); // 40 weeks = 280 days

    // Calculate conception date (approximately 2 weeks after LMP)
    const conceptionDate = new Date(lmpDate);
    conceptionDate.setDate(conceptionDate.getDate() + 14);

    // Calculate important milestones
    const firstTrimesterEnd = new Date(lmpDate);
    firstTrimesterEnd.setDate(firstTrimesterEnd.getDate() + 84); // 12 weeks

    const secondTrimesterEnd = new Date(lmpDate);
    secondTrimesterEnd.setDate(secondTrimesterEnd.getDate() + 182); // 26 weeks

    return {
        dueDate: dueDate.toISOString().split('T')[0],
        conceptionDate: conceptionDate.toISOString().split('T')[0],
        milestones: {
            firstTrimesterEnd: firstTrimesterEnd.toISOString().split('T')[0],
            secondTrimesterEnd: secondTrimesterEnd.toISOString().split('T')[0],
            thirdTrimesterEnd: dueDate.toISOString().split('T')[0]
        }
    };
}

function getWeeklyRecommendations(currentWeek) {
    const recommendations = {
        nutrition: [],
        exercise: [],
        lifestyle: [],
        medical: []
    };

    // First trimester (weeks 1-12)
    if (currentWeek <= 12) {
        recommendations.nutrition = [
            'Take prenatal vitamins with folic acid',
            'Stay hydrated with 8-10 glasses of water daily',
            'Eat small, frequent meals to manage morning sickness',
            'Focus on protein-rich foods'
        ];
        recommendations.exercise = [
            'Light walking for 20-30 minutes daily',
            'Gentle stretching exercises',
            'Avoid high-impact activities'
        ];
        recommendations.lifestyle = [
            'Get plenty of rest',
            'Avoid alcohol and smoking',
            'Limit caffeine intake'
        ];
        recommendations.medical = [
            'Schedule first prenatal visit',
            'Get necessary blood tests',
            'Discuss any medications with healthcare provider'
        ];
    }
    // Second trimester (weeks 13-26)
    else if (currentWeek <= 26) {
        recommendations.nutrition = [
            'Increase calcium intake',
            'Add iron-rich foods to diet',
            'Continue prenatal vitamins',
            'Monitor weight gain'
        ];
        recommendations.exercise = [
            'Moderate walking or swimming',
            'Prenatal yoga classes',
            'Kegel exercises',
            'Avoid exercises that risk falling'
        ];
        recommendations.lifestyle = [
            'Start planning nursery',
            'Consider childbirth classes',
            'Sleep on left side for better blood flow'
        ];
        recommendations.medical = [
            'Schedule regular prenatal check-ups',
            'Get anatomy ultrasound',
            'Monitor blood pressure'
        ];
    }
    // Third trimester (weeks 27-40)
    else {
        recommendations.nutrition = [
            'Eat frequent, small meals',
            'Focus on nutrient-dense foods',
            'Monitor fluid intake',
            'Watch for heartburn triggers'
        ];
        recommendations.exercise = [
            'Gentle walking',
            'Stretching exercises',
            'Pelvic floor exercises',
            'Avoid strenuous activities'
        ];
        recommendations.lifestyle = [
            'Prepare hospital bag',
            'Finalize birth plan',
            'Practice relaxation techniques',
            'Monitor fetal movements'
        ];
        recommendations.medical = [
            'Weekly check-ups in final month',
            'Monitor for labor signs',
            'Get Group B strep test',
            'Discuss birth plan with healthcare provider'
        ];
    }

    return recommendations;
}

function generateHealthAlerts(data) {
    const alerts = [];
    const { currentWeek, symptoms = [], weight, bloodPressure } = data;

    // Check for concerning symptoms
    const warningSymptoms = [
        'severe headache',
        'blurred vision',
        'severe abdominal pain',
        'vaginal bleeding',
        'reduced fetal movement',
        'severe swelling'
    ];

    symptoms.forEach(symptom => {
        if (warningSymptoms.includes(symptom.toLowerCase())) {
            alerts.push({
                level: 'high',
                type: 'symptom',
                message: `Immediate medical attention recommended for: ${symptom}`
            });
        }
    });

    // Check blood pressure if provided
    if (bloodPressure) {
        const [systolic, diastolic] = bloodPressure.split('/').map(Number);
        if (systolic >= 140 || diastolic >= 90) {
            alerts.push({
                level: 'high',
                type: 'blood_pressure',
                message: 'Blood pressure is elevated. Contact healthcare provider.'
            });
        }
    }

    // Weight gain alerts
    if (weight) {
        // Recommended weight gain ranges based on pre-pregnancy BMI
        // This is a simplified version - should be customized based on pre-pregnancy BMI
        const weeklyGainLimits = {
            min: 0.5, // pounds
            max: 1.0  // pounds
        };

        if (currentWeek > 12) { // After first trimester
            if (weight.weeklyGain < weeklyGainLimits.min) {
                alerts.push({
                    level: 'medium',
                    type: 'weight',
                    message: 'Weight gain is below recommended range. Discuss nutrition with healthcare provider.'
                });
            } else if (weight.weeklyGain > weeklyGainLimits.max) {
                alerts.push({
                    level: 'medium',
                    type: 'weight',
                    message: 'Weight gain is above recommended range. Discuss with healthcare provider.'
                });
            }
        }
    }

    return alerts;
}

module.exports = router;