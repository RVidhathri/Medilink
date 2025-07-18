import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Vitals = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    temperature: '',
    oxygenLevel: '',
    glucoseLevel: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [assessment, setAssessment] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateVitals = () => {
    let concerns = [];
    let urgentConcerns = [];
    let doctorRecommendations = [];

    const systolic = parseFloat(formData.systolic);
    const diastolic = parseFloat(formData.diastolic);
    const heartRate = parseFloat(formData.heartRate);
    const temperature = parseFloat(formData.temperature);
    const oxygenLevel = parseFloat(formData.oxygenLevel);
    const glucoseLevel = parseFloat(formData.glucoseLevel);

    // Blood Pressure Validation
    if (systolic > 140 || diastolic > 90) {
      urgentConcerns.push('High blood pressure detected');
      doctorRecommendations.push(
        'Schedule an urgent appointment with your doctor',
        'Monitor blood pressure every 4 hours',
        'Reduce salt intake',
        'Avoid strenuous activities'
      );
    } else if (systolic < 90 || diastolic < 60) {
      urgentConcerns.push('Low blood pressure detected');
      doctorRecommendations.push(
        'Consult with your doctor immediately',
        'Stay hydrated',
        'Monitor for dizziness or fainting',
        'Increase salt intake if recommended by doctor'
      );
    }

    // Heart Rate Validation
    if (heartRate > 100) {
      concerns.push('Elevated heart rate');
      doctorRecommendations.push(
        'Schedule a check-up with your doctor',
        'Avoid caffeine and stimulants',
        'Practice relaxation techniques',
        'Monitor heart rate regularly'
      );
    } else if (heartRate < 60) {
      concerns.push('Low heart rate');
      doctorRecommendations.push(
        'Consult with your doctor',
        'Monitor energy levels',
        'Check medications with your doctor',
        'Regular heart rate monitoring'
      );
    }

    // Temperature Validation
    if (temperature > 38) {
      urgentConcerns.push('High fever detected');
      doctorRecommendations.push(
        'Seek immediate medical attention',
        'Take fever-reducing medication',
        'Stay hydrated',
        'Monitor temperature every 2 hours'
      );
    } else if (temperature > 37.2) {
      concerns.push('Mild fever detected');
      doctorRecommendations.push(
        'Rest and monitor temperature',
        'Stay hydrated',
        'Contact doctor if fever persists over 24 hours'
      );
    }

    // Oxygen Level Validation
    if (oxygenLevel < 92) {
      urgentConcerns.push('Critical oxygen level');
      doctorRecommendations.push(
        'Seek emergency medical care immediately',
        'Use supplemental oxygen if prescribed',
        'Sit upright and practice deep breathing',
        'Call emergency services if symptoms worsen'
      );
    } else if (oxygenLevel < 95) {
      concerns.push('Low oxygen level');
      doctorRecommendations.push(
        'Consult with your doctor',
        'Monitor oxygen levels frequently',
        'Practice breathing exercises',
        'Avoid strenuous activities'
      );
    }

    // Glucose Level Validation
    if (glucoseLevel > 200) {
      urgentConcerns.push('High blood sugar level');
      doctorRecommendations.push(
        'Contact your doctor immediately',
        'Check ketones if type 1 diabetic',
        'Stay hydrated',
        'Monitor blood sugar every 2-3 hours'
      );
    } else if (glucoseLevel < 70) {
      urgentConcerns.push('Low blood sugar level');
      doctorRecommendations.push(
        'Take fast-acting glucose immediately',
        'Contact your doctor',
        'Monitor blood sugar every hour',
        'Have someone stay with you'
      );
    }

    return {
      needsUrgentCare: urgentConcerns.length > 0,
      needsAttention: concerns.length > 0,
      concerns: [...urgentConcerns, ...concerns],
      recommendations: doctorRecommendations
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setAssessment(null);

    try {
      const assessment = validateVitals();
      
      const response = await axios.post('/api/vitals', {
        userId: user.id,
        vitals: {
          bloodPressure: {
            systolic: parseInt(formData.systolic),
            diastolic: parseInt(formData.diastolic)
          },
          heartRate: parseInt(formData.heartRate),
          temperature: parseFloat(formData.temperature),
          oxygenLevel: parseInt(formData.oxygenLevel),
          glucoseLevel: parseInt(formData.glucoseLevel)
        },
        assessment
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess(true);
      setAssessment(assessment);
    } catch (err) {
      console.error('Error recording vitals:', err);
      setError(err.response?.data?.message || 'Failed to record vitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (method) => {
    try {
      const response = await axios.post('/api/share-vitals', {
        userId: user.id,
        vitals: formData,
        assessment,
        shareMethod: method
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSuccess(true);
      setError(`Vitals shared successfully via ${method}`);
    } catch (err) {
      setError('Failed to share vitals. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Record Vitals</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && !error && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">Vitals recorded successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    name="systolic"
                    value={formData.systolic}
                    onChange={handleInputChange}
                    placeholder="Systolic"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                    min="60"
                    max="200"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="diastolic"
                    value={formData.diastolic}
                    onChange={handleInputChange}
                    placeholder="Diastolic"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    required
                    min="40"
                    max="120"
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
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="40"
                max="200"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="35"
                max="42"
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
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="70"
                max="100"
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
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required
                min="40"
                max="400"
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

        {/* Assessment and Recommendations Section */}
        {assessment && (
          <div className="space-y-6">
            {/* Health Status */}
            <div className={`bg-white shadow rounded-lg p-6 ${
              assessment.needsUrgentCare ? 'border-l-4 border-red-500' : 
              assessment.needsAttention ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'
            }`}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Assessment</h2>
              
              {assessment.needsUrgentCare ? (
                <div className="bg-red-50 p-4 rounded-md mb-4">
                  <p className="text-red-700 font-medium">⚠️ Urgent Medical Attention Required</p>
                  <p className="text-sm text-red-600 mt-2">
                    Based on your vitals, you should seek immediate medical care.
                  </p>
                </div>
              ) : assessment.needsAttention ? (
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <p className="text-yellow-700 font-medium">⚠️ Medical Attention Recommended</p>
                  <p className="text-sm text-yellow-600 mt-2">
                    Some of your vitals require medical attention. Please consult with a healthcare provider.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-md mb-4">
                  <p className="text-green-700 font-medium">✓ Vitals Within Normal Range</p>
                  <p className="text-sm text-green-600 mt-2">
                    Your vitals appear to be within normal ranges. Continue monitoring regularly.
                  </p>
                </div>
              )}

              {/* Specific Concerns */}
              {assessment.concerns.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">Specific Concerns:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {assessment.concerns.map((concern, index) => (
                      <li key={index} className="text-sm text-gray-700">{concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doctor Recommendations */}
              {assessment.recommendations.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Doctor Recommendations:</h3>
                  <ul className="space-y-2">
                    {assessment.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <span className="text-primary mr-2">•</span>
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Share Options */}
              {(assessment.needsUrgentCare || assessment.needsAttention) && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Share with Healthcare Provider</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleShare('chat')}
                      className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Share via Chat
                    </button>
                    <Link
                      to="/chat"
                      className="flex-1 py-2 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-center"
                    >
                      Go to Chat
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vitals; 