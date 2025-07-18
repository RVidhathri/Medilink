import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const VitalsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const analyzeVitals = (vitals) => {
    const recommendations = {
      alerts: [],
      suggestions: []
    };

    // Blood Pressure Analysis
    const systolic = parseInt(vitals.bloodPressure.systolic);
    const diastolic = parseInt(vitals.bloodPressure.diastolic);

    if (systolic >= 140 || diastolic >= 90) {
      recommendations.alerts.push({
        type: 'danger',
        message: 'High blood pressure detected. Please consult a doctor.'
      });
      recommendations.suggestions.push(
        'Reduce salt intake',
        'Practice stress management techniques',
        'Regular exercise (30 minutes daily)',
        'Monitor blood pressure regularly'
      );
    } else if (systolic <= 90 || diastolic <= 60) {
      recommendations.alerts.push({
        type: 'warning',
        message: 'Low blood pressure detected.'
      });
      recommendations.suggestions.push(
        'Stay hydrated',
        'Eat small, frequent meals',
        'Avoid standing up quickly',
        'Consider increasing salt intake (consult doctor first)'
      );
    }

    // Heart Rate Analysis
    const heartRate = parseInt(vitals.heartRate);
    if (heartRate > 100) {
      recommendations.alerts.push({
        type: 'warning',
        message: 'Elevated heart rate detected.'
      });
      recommendations.suggestions.push(
        'Practice deep breathing exercises',
        'Avoid caffeine and stimulants',
        'Get adequate rest'
      );
    } else if (heartRate < 60) {
      recommendations.alerts.push({
        type: 'warning',
        message: 'Low heart rate detected.'
      });
      recommendations.suggestions.push(
        'Consult with your doctor',
        'Monitor your energy levels',
        'Stay active within safe limits'
      );
    }

    // Temperature Analysis
    const temp = parseFloat(vitals.temperature);
    if (temp >= 38) {
      recommendations.alerts.push({
        type: 'danger',
        message: 'Fever detected. Monitor closely and seek medical attention if it persists.'
      });
      recommendations.suggestions.push(
        'Rest and stay hydrated',
        'Take fever-reducing medication if needed',
        'Monitor temperature regularly'
      );
    }

    // Oxygen Level Analysis
    const oxygenLevel = parseInt(vitals.oxygenLevel);
    if (oxygenLevel < 95) {
      recommendations.alerts.push({
        type: 'danger',
        message: 'Low oxygen levels detected. Seek immediate medical attention if below 92%.'
      });
      recommendations.suggestions.push(
        'Practice deep breathing exercises',
        'Sit upright to help breathing',
        'Seek immediate medical care if symptoms worsen'
      );
    }

    // Glucose Level Analysis
    const glucose = parseInt(vitals.glucoseLevel);
    if (glucose > 140) {
      recommendations.alerts.push({
        type: 'warning',
        message: 'Elevated blood glucose detected.'
      });
      recommendations.suggestions.push(
        'Monitor carbohydrate intake',
        'Stay hydrated',
        'Exercise regularly',
        'Consider consulting with a diabetes educator'
      );
    } else if (glucose < 70) {
      recommendations.alerts.push({
        type: 'danger',
        message: 'Low blood glucose detected. Take immediate action.'
      });
      recommendations.suggestions.push(
        'Consume fast-acting carbohydrates',
        'Monitor glucose levels frequently',
        'Have glucose tablets or juice readily available'
      );
    }

    return recommendations;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setRecommendations(null);

    try {
      await api.post('/api/vitals', {
        patientId: user.id,
        ...formData
      });
      navigate('/patient-dashboard');
    } catch (error) {
      setError('Failed to submit vitals data');
      console.error('Error submitting vitals:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Record Vitals</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Vitals Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Blood Pressure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Pressure (mmHg)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="bloodPressure.systolic"
                    value={formData.bloodPressure.systolic}
                    onChange={handleChange}
                    placeholder="Systolic"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="bloodPressure.diastolic"
                    value={formData.bloodPressure.diastolic}
                    onChange={handleChange}
                    placeholder="Diastolic"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Heart Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            {/* Oxygen Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oxygen Level (%)
              </label>
              <input
                type="number"
                name="oxygenLevel"
                value={formData.oxygenLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            {/* Glucose Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glucose Level (mg/dL)
              </label>
              <input
                type="number"
                name="glucoseLevel"
                value={formData.glucoseLevel}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? 'Recording...' : 'Record Vitals'}
            </button>
          </form>
        </div>

        {/* Recommendations Display */}
        <div>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-green-700">Vitals recorded successfully!</p>
            </div>
          )}

          {recommendations && (
            <div className="space-y-6">
              {/* Alerts */}
              {recommendations.alerts.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Alerts</h2>
                  <div className="space-y-4">
                    {recommendations.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg ${
                          alert.type === 'danger'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {alert.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {recommendations.suggestions.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Recommendations
                  </h2>
                  <ul className="space-y-2">
                    {recommendations.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VitalsPage; 