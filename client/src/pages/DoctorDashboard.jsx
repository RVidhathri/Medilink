import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import HealthRecords from '../components/HealthRecords.jsx';
import Profile from '../components/Profile';
import PatientVitals from '../components/PatientVitals';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch connected patients
      const patientsResponse = await api.get(
        `/api/doctors/${user.id}/patients`
      );
      setPatients(patientsResponse.data);

      // Fetch connection requests
      const requestsResponse = await api.get(
        `/api/doctors/${user.id}/requests/pending`
      );
      setConnectionRequests(requestsResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      if (err.response?.status === 404) {
        // If no data found, set empty arrays
        setPatients([]);
        setConnectionRequests([]);
        setLoading(false);
      } else {
        setError('Failed to fetch dashboard data');
        setLoading(false);
      }
    }
  };

  const handleConnectionRequest = async (requestId, status) => {
    try {
      await api.put(
        `/api/doctors/requests/${requestId}`,
        { status }
      );
      
      // Refetch data after updating request
      await fetchData();
    } catch (err) {
      console.error('Connection request error:', err);
      setError('Failed to update connection request');
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('records');
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setActiveTab('overview');
              setSelectedPatient(null);
            }}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'overview'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dashboard Overview
          </button>
          {selectedPatient && (
            <>
              <button
                onClick={() => setActiveTab('records')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'records'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Patient Records
              </button>
              <button
                onClick={() => setActiveTab('vitals')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'vitals'
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Patient Vitals
              </button>
            </>
          )}
          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedPatient(null);
            }}
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
      ) : activeTab === 'records' && selectedPatient ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Health Records for {selectedPatient.name}
            </h2>
          </div>
          <HealthRecords userRole="doctor" patientId={selectedPatient._id} />
        </div>
      ) : activeTab === 'vitals' && selectedPatient ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Vitals for {selectedPatient.name}
            </h2>
          </div>
          <PatientVitals patientId={selectedPatient._id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Connection Requests Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connection Requests
            </h2>
            {connectionRequests.length > 0 ? (
              <div className="space-y-4">
                {connectionRequests.map((request) => (
                  <div
                    key={request._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.patient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Age: {request.patient.age}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Reason: {request.reason}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleConnectionRequest(request._id, 'approved')}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleConnectionRequest(request._id, 'rejected')}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pending connection requests.</p>
            )}
          </div>

          {/* Connected Patients Card */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Patients
            </h2>
            {patients.length > 0 ? (
              <div className="space-y-4">
                {patients.map((patient) => (
                  <div
                    key={patient._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handlePatientSelect(patient)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Age: {patient.age}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/chat/${patient._id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Chat
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setActiveTab('records');
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Records
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatient(patient);
                            setActiveTab('vitals');
                          }}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Vitals
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No patients connected yet.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-700">Total Patients</h3>
                <p className="text-3xl font-bold text-blue-900">{patients.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-700">Pending Requests</h3>
                <p className="text-3xl font-bold text-green-900">{connectionRequests.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-purple-700">Active Chats</h3>
                <p className="text-3xl font-bold text-purple-900">
                  {patients.filter(p => p.hasActiveChat).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard; 