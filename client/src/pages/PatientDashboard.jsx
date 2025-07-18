import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import HealthRecords from '../components/HealthRecords.jsx';
import Profile from '../components/Profile';

const PatientDashboard = () => {
  const [vitals, setVitals] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest vitals
        console.log('Fetching vitals for patient:', user.id);
        const vitalsResponse = await api.get(`/api/vitals/${user.id}`);
        console.log('Vitals response:', vitalsResponse.data);
        
        // Get the most recent vitals from the array
        const latestVitals = vitalsResponse.data[0];
        setVitals(latestVitals);

        // Fetch connected doctors
        const doctorsResponse = await api.get(`/api/users/${user.id}/connected-doctors`);
        setDoctors(doctorsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard error:', err);
        if (err.response?.status === 404) {
          setVitals(null);
          try {
            const doctorsResponse = await api.get(`/api/users/${user.id}/connected-doctors`);
            setDoctors(doctorsResponse.data);
          } catch (doctorsErr) {
            console.error('Failed to fetch doctors:', doctorsErr);
            setDoctors([]);
          }
        } else {
          setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        }
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'overview'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'records'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Health Records
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'profile'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <Profile />
      ) : activeTab === 'records' ? (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Health Records</h2>
            <Link
              to="/add-health-record"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Health Record
            </Link>
          </div>
          <HealthRecords />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Latest Vitals Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Vitals</h2>
            {vitals ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Blood Pressure:</span>
                  <span className="font-medium">
                    {vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Heart Rate:</span>
                  <span className="font-medium">{vitals.heartRate} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temperature:</span>
                  <span className="font-medium">{vitals.temperature}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {format(new Date(vitals.date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No vitals recorded yet</p>
            )}
            <div className="mt-6">
              <Link
                to="/vitals"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                Record New Vitals
              </Link>
            </div>
          </div>

          {/* Connected Doctors Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Doctors</h2>
            {doctors.length > 0 ? (
              <div className="space-y-4">
                {doctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {doctor.name}
                        </h3>
                        <p className="text-sm text-gray-500">{doctor.specialization}</p>
                      </div>
                      <Link
                        to={`/chat/${doctor._id}`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Chat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No doctors connected yet</p>
            )}
            <div className="mt-6">
              <Link
                to="/find-doctor"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                Find a Doctor
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/vitals"
                className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition-colors text-center"
              >
                Record New Vitals
              </Link>
              <Link
                to="/diet-plan"
                className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 transition-colors text-center"
              >
                View Diet Plan
              </Link>
              <Link
                to="/pregnancy-tracker"
                className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition-colors text-center"
              >
                Pregnancy Tracker
              </Link>
              <Link
                to="/find-doctor"
                className="bg-indigo-500 text-white p-4 rounded-lg hover:bg-indigo-600 transition-colors text-center"
              >
                Find a Doctor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard; 