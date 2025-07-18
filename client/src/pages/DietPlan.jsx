import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const DietPlan = () => {
  const [preferences, setPreferences] = useState({
    dietType: 'veg',
    conditions: []
  });
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const conditions = [
    { id: 'daily_fitness', label: 'Daily Fitness & Healthy Living' },
    { id: 'diabetes', label: 'Diabetes' },
    { id: 'hypertension', label: 'High Blood Pressure' },
    { id: 'heart_disease', label: 'Heart Disease' },
    { id: 'weight_management', label: 'Weight Management' }
  ];

  const handleConditionToggle = (conditionId) => {
    setPreferences(prev => ({
      ...prev,
      conditions: prev.conditions.includes(conditionId)
        ? prev.conditions.filter(id => id !== conditionId)
        : [...prev.conditions, conditionId]
    }));
  };

  const generateDietPlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/diet-plan/generate', {
        userId: user.id,
        dietType: preferences.dietType,
        goals: preferences.conditions
      });

      setDietPlan(response.data);
      setError('');
    } catch (err) {
      console.error('Diet plan error:', err);
      setError('Request failed with status code 404');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingDietPlan = async () => {
    try {
      const response = await api.get(`/api/diet-plan/${user.id}`);
      if (response.data) {
        setDietPlan(response.data);
        setPreferences({
          dietType: response.data.dietType || 'veg',
          conditions: response.data.goals || []
        });
        setError('');
      }
    } catch (err) {
      console.log('No existing diet plan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Personalized Diet Plan</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Preferences Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Preferences</h2>
            
            <div className="space-y-6">
              {/* Diet Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diet Type
                </label>
                <select
                  value={preferences.dietType}
                  onChange={(e) => setPreferences({ ...preferences, dietType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Vegetarian</option>
                </select>
              </div>

              {/* Health Conditions or Daily Fitness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Goal
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose "Daily Fitness" for general health or select specific health conditions for a customized plan.
                </p>
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <label key={condition.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.conditions.includes(condition.id)}
                        onChange={() => handleConditionToggle(condition.id)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={generateDietPlan}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {loading ? 'Generating...' : 'Generate Diet Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Diet Plan Display */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {dietPlan ? (
            <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
              {/* Meal Plan */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Meal Plan</h2>
                <div className="space-y-6">
                  {dietPlan.meals.map((meal, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{meal.name}</h3>
                      <ul className="space-y-2">
                        {meal.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="text-gray-500">{item.portion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exercise Plan */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Exercise Plan</h2>
                <div className="grid gap-4">
                  {dietPlan.exercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Duration: {exercise.duration} • Frequency: {exercise.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {dietPlan.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              Select your preferences and generate a personalized diet plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DietPlan; 