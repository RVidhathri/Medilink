import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format, addWeeks, differenceInWeeks, isAfter } from 'date-fns';

const PregnancyTracker = () => {
  const [pregnancyData, setPregnancyData] = useState(null);
  const [lmpDate, setLmpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchPregnancyData();
  }, [user?.id]);

  const fetchPregnancyData = async () => {
    try {
      const response = await api.get(`/api/pregnancy-tracker/${user.id}`);
      if (response.data) {
        setPregnancyData(response.data);
        setLmpDate(format(new Date(response.data.lmpDate), 'yyyy-MM-dd'));
        setError('');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        console.log('No existing pregnancy data');
      } else {
        setError('Failed to fetch pregnancy data. Please try again.');
      }
    }
  };

  const calculatePregnancyInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate LMP date is not in the future
      const lmpDateObj = new Date(lmpDate);
      const today = new Date();
      
      if (isAfter(lmpDateObj, today)) {
        throw new Error('Last Menstrual Period date cannot be in the future');
      }
      
      // Calculate pregnancy info locally first
      const dueDate = addWeeks(lmpDateObj, 40);
      const currentWeek = differenceInWeeks(today, lmpDateObj);
      
      // Validate pregnancy weeks
      if (currentWeek < 0) {
        throw new Error('Invalid pregnancy duration. Please check the date.');
      }
      
      const pregnancyInfo = {
        lmpDate: lmpDate,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        currentWeek: currentWeek,
        trimester: currentWeek <= 13 ? '1st' : currentWeek <= 26 ? '2nd' : '3rd',
        progress: Math.min(Math.round((currentWeek / 40) * 100), 100)
      };
      
      // Save to backend
      const response = await api.post('/api/pregnancy-tracker', {
        patientId: user.id,
        ...pregnancyInfo
      });
      
      setPregnancyData(response.data);
      setError('');
    } catch (err) {
      console.error('Pregnancy tracker error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to calculate pregnancy information. Please ensure the date is valid.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeek = () => {
    if (!pregnancyData?.lmpDate) return null;
    const weeks = differenceInWeeks(new Date(), new Date(pregnancyData.lmpDate));
    return weeks > 0 && weeks <= 40 ? weeks : null;
  };

  const currentWeek = getCurrentWeek();

  // Weekly information data
  const getWeeklyInfo = (week) => {
    const weeklyData = {
      7: {
        development: [
          "Your baby is now the size of a blueberry (about 0.5 inches long)",
          "Major organs (heart, lungs, liver, and kidneys) continue developing",
          "Arm and leg buds are growing longer and taking on a more defined shape",
          "Tiny nostrils become visible on the surface of the nose",
          "Brain development is progressing rapidly",
          "Eye lenses are beginning to form"
        ],
        bodyChanges: [
          "You may experience increased morning sickness",
          "Frequent urination due to hormonal changes",
          "Mild cramping or spotting might occur (consult doctor if concerned)",
          "Breast tenderness and growth",
          "Fatigue and mood swings are common",
          "Possible food aversions or cravings"
        ],
        recommendedFoods: [
          "Leafy greens (spinach, kale) rich in folate",
          "Lean proteins (chicken, fish, legumes)",
          "Whole grains for energy and fiber",
          "Dairy products for calcium",
          "Fresh fruits and vegetables",
          "Nuts and seeds for healthy fats"
        ],
        foodsToAvoid: [
          "Raw or undercooked meat, fish, and eggs",
          "Unpasteurized dairy products",
          "High-mercury fish (shark, swordfish, king mackerel)",
          "Raw sprouts",
          "Unwashed fruits and vegetables",
          "Excess caffeine (limit to 200mg per day)"
        ],
        tips: [
          "Schedule your first prenatal appointment if you haven't already",
          "Start taking prenatal vitamins regularly",
          "Stay hydrated by drinking 8-10 glasses of water daily",
          "Get plenty of rest - aim for 8 hours of sleep",
          "Begin pregnancy-safe exercises if approved by your doctor",
          "Track any unusual symptoms and discuss with your healthcare provider"
        ]
      }
      // Add more weeks as needed
    };

    return weeklyData[week] || {
      development: ["Your baby is continuing to grow and develop!"],
      bodyChanges: ["Your body is adapting to support your growing baby."],
      recommendedFoods: ["Maintain a balanced, nutritious diet"],
      foodsToAvoid: ["Avoid harmful substances and unsafe foods"],
      tips: ["Regular prenatal check-ups are important"]
    };
  };

  const weekInfo = currentWeek ? getWeeklyInfo(currentWeek) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pregnancy Tracker</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* LMP Input Form */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Calculate Due Date
            </h2>
            <form onSubmit={calculatePregnancyInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Menstrual Period (LMP)
                </label>
                <input
                  type="date"
                  value={lmpDate}
                  onChange={(e) => setLmpDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {loading ? 'Calculating...' : 'Calculate'}
              </button>
            </form>
          </div>
        </div>

        {/* Pregnancy Information Display */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {pregnancyData ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Current Week</p>
                    <p className="mt-1 text-3xl font-semibold text-primary">
                      {currentWeek || '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <p className="mt-1 text-xl font-medium text-gray-900">
                      {pregnancyData.dueDate ? format(new Date(pregnancyData.dueDate), 'MMM d, yyyy') : '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Trimester</p>
                    <p className="mt-1 text-xl font-medium text-gray-900">
                      {currentWeek <= 13 ? '1st' : currentWeek <= 26 ? '2nd' : '3rd'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">Progress</p>
                    <div className="mt-2 relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div
                          style={{ width: `${Math.min((currentWeek / 40) * 100, 100)}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Information */}
              {currentWeek && weekInfo && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Week {currentWeek} Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Baby Development */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Baby's Development
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <ul className="space-y-2">
                            {weekInfo.development.map((item, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Mother's Changes */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Changes in Your Body
                        </h3>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <ul className="space-y-2">
                            {weekInfo.bodyChanges.map((item, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700">
                                <span className="text-purple-500 mr-2">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diet Recommendations */}
                  <div className="border-t border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Nutrition Guidelines
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">Recommended Foods</h4>
                        <ul className="space-y-2">
                          {weekInfo.recommendedFoods.map((food, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <span className="text-green-500 mr-2">✓</span>
                              <span>{food}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-2">Foods to Avoid</h4>
                        <ul className="space-y-2">
                          {weekInfo.foodsToAvoid.map((food, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <span className="text-red-500 mr-2">✕</span>
                              <span>{food}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Tips and Recommendations */}
                  <div className="border-t border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Tips & Recommendations
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <ul className="space-y-3">
                        {weekInfo.tips.map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-600 mr-2">★</span>
                            <span className="text-sm text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
              Enter your Last Menstrual Period (LMP) date to start tracking your pregnancy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PregnancyTracker; 