const express = require('express');
const router = express.Router();
const DietPlan = require('../models/DietPlan');
const authenticateToken = require('../middleware/auth');

// Create diet plan
router.post('/', authenticateToken, async (req, res) => {
  try {
    const dietPlan = new DietPlan(req.body);
    await dietPlan.save();
    res.status(201).json(dietPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get diet plan for a patient
router.get('/:patientId', authenticateToken, async (req, res) => {
  try {
    const dietPlan = await DietPlan.findOne({ patientId: req.params.patientId })
      .sort({ createdAt: -1 });
    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST route to generate diet plan
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { 
            dietType,
            conditions = []
        } = req.body;

        // Generate meal plan based on diet type and conditions
        const meals = generateSimpleMealPlan(dietType, conditions);
        const exercises = generateExercisePlan(conditions);
        const recommendations = generateRecommendations(conditions);

        res.json({
            meals,
            exercises,
            recommendations
        });
    } catch (error) {
        console.error('Error generating diet plan:', error);
        res.status(500).json({ message: 'Error generating diet plan' });
    }
});

function generateSimpleMealPlan(dietType, conditions) {
    const isVeg = dietType.toLowerCase() === 'veg';
    
    const proteinSources = isVeg ? 
        ['Tofu', 'Lentils', 'Chickpeas', 'Greek Yogurt', 'Cottage Cheese', 'Quinoa'] :
        ['Chicken Breast', 'Fish', 'Eggs', 'Lean Beef', 'Turkey', 'Tuna'];

    const commonItems = {
        grains: ['Brown Rice', 'Whole Wheat Roti', 'Quinoa', 'Oats'],
        vegetables: ['Mixed Vegetables', 'Green Leafy Vegetables', 'Bell Peppers', 'Broccoli'],
        fruits: ['Apple', 'Banana', 'Orange', 'Berries'],
        healthy_fats: ['Nuts', 'Seeds', 'Olive Oil', 'Avocado']
    };

    // Adjust portions and items based on conditions
    let portionModifier = '';
    let mealPlan;

    if (conditions.includes('daily_fitness')) {
        mealPlan = [
            {
                name: 'Breakfast',
                items: [
                    { name: 'Oats with Milk', portion: '1 cup' },
                    { name: 'Mixed Fruits', portion: '1 cup' },
                    { name: 'Nuts and Seeds Mix', portion: '1 handful' }
                ]
            },
            {
                name: 'Mid-Morning Snack',
                items: [
                    { name: 'Greek Yogurt', portion: '1 cup' },
                    { name: 'Honey', portion: '1 tsp' },
                    { name: 'Mixed Berries', portion: '1/2 cup' }
                ]
            },
            {
                name: 'Lunch',
                items: [
                    { name: isVeg ? 'Lentils Curry' : 'Grilled Chicken', portion: '150g' },
                    { name: 'Brown Rice', portion: '1 cup' },
                    { name: 'Mixed Vegetables', portion: '1 cup' },
                    { name: 'Salad', portion: '1 bowl' }
                ]
            },
            {
                name: 'Evening Snack',
                items: [
                    { name: 'Protein Shake', portion: '1 glass' },
                    { name: 'Banana', portion: '1 medium' }
                ]
            },
            {
                name: 'Dinner',
                items: [
                    { name: isVeg ? 'Tofu Stir Fry' : 'Fish/Lean Meat', portion: '150g' },
                    { name: 'Quinoa/Brown Rice', portion: '1 cup' },
                    { name: 'Steamed Vegetables', portion: '1 cup' }
                ]
            }
        ];
    } else {
        // Modify portions based on health conditions
        if (conditions.includes('diabetes')) {
            commonItems.grains = ['Brown Rice (small portion)', 'Whole Wheat Roti (1-2)', 'Quinoa (small portion)'];
            portionModifier = '(sugar-free)';
        }
        if (conditions.includes('hypertension')) {
            portionModifier = '(low-sodium)';
        }
        if (conditions.includes('heart_disease')) {
            portionModifier = '(low-fat)';
        }

        mealPlan = [
            {
                name: 'Breakfast',
                items: [
                    { name: commonItems.grains[0] + ' ' + portionModifier, portion: '1/2 cup' },
                    { name: proteinSources[0], portion: '100g' },
                    { name: commonItems.fruits[0], portion: '1 small' }
                ]
            },
            {
                name: 'Lunch',
                items: [
                    { name: commonItems.grains[1] + ' ' + portionModifier, portion: '2 pieces' },
                    { name: proteinSources[1], portion: '150g' },
                    { name: commonItems.vegetables[0] + ' ' + portionModifier, portion: '1 cup' },
                    { name: commonItems.healthy_fats[0], portion: '1 tbsp' }
                ]
            },
            {
                name: 'Evening Snack',
                items: [
                    { name: commonItems.fruits[1] + ' ' + portionModifier, portion: '1 piece' },
                    { name: 'Green Tea', portion: '1 cup' }
                ]
            },
            {
                name: 'Dinner',
                items: [
                    { name: commonItems.grains[2] + ' ' + portionModifier, portion: '1/2 cup' },
                    { name: proteinSources[2], portion: '150g' },
                    { name: commonItems.vegetables[1] + ' ' + portionModifier, portion: '1 cup' }
                ]
            }
        ];
    }

    return mealPlan;
}

function generateExercisePlan(conditions) {
    if (conditions.includes('daily_fitness')) {
        return [
            { name: 'Morning Cardio (Running/Cycling)', duration: '30 minutes', frequency: '5-6 times per week' },
            { name: 'Strength Training', duration: '45 minutes', frequency: '3-4 times per week' },
            { name: 'Yoga/Stretching', duration: '20 minutes', frequency: 'Daily' },
            { name: 'Evening Walk', duration: '20 minutes', frequency: 'Daily' }
        ];
    }

    // For health conditions
    const exercises = [
        { name: 'Light Walking', duration: '20 minutes', frequency: 'Daily' },
        { name: 'Gentle Stretching', duration: '10 minutes', frequency: 'Daily' }
    ];

    if (conditions.includes('diabetes')) {
        exercises.push(
            { name: 'Post-meal Walking', duration: '10 minutes', frequency: 'After main meals' },
            { name: 'Light Yoga', duration: '15 minutes', frequency: '3-4 times per week' }
        );
    }

    if (conditions.includes('hypertension')) {
        exercises.push(
            { name: 'Breathing Exercises', duration: '10 minutes', frequency: 'Twice daily' },
            { name: 'Swimming/Water Exercises', duration: '20 minutes', frequency: '2-3 times per week' }
        );
    }

    return exercises;
}

function generateRecommendations(conditions) {
    if (conditions.includes('daily_fitness')) {
        return [
            'Stay hydrated by drinking 8-10 glasses of water daily',
            'Eat protein-rich foods within 30 minutes after workout',
            'Get 7-8 hours of quality sleep',
            'Include a mix of cardio and strength training',
            'Take rest days to allow muscle recovery',
            'Monitor your progress and adjust intensity gradually',
            'Maintain a food diary to track nutrition',
            'Consider pre and post-workout nutrition timing'
        ];
    }

    const recommendations = [
        'Stay hydrated by drinking 8-10 glasses of water daily',
        'Eat meals at regular intervals',
        'Include fiber-rich foods in your diet'
    ];

    if (conditions.includes('diabetes')) {
        recommendations.push(
            'Monitor blood sugar levels regularly',
            'Avoid sugary foods and beverages',
            'Space meals evenly throughout the day',
            'Keep healthy snacks handy for blood sugar management'
        );
    }

    if (conditions.includes('hypertension')) {
        recommendations.push(
            'Limit salt intake to less than 2300mg per day',
            'Avoid processed foods',
            'Monitor blood pressure regularly',
            'Practice stress management techniques'
        );
    }

    if (conditions.includes('heart_disease')) {
        recommendations.push(
            'Limit saturated fats',
            'Choose lean proteins',
            'Include heart-healthy fats like omega-3',
            'Avoid trans fats and processed foods'
        );
    }

    return recommendations;
}

module.exports = router; 