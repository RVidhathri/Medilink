import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const FindDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [connectionReason, setConnectionReason] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/doctors');
        setDoctors(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setError(err.response?.data?.message || 'Failed to fetch doctors');
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const handleConnect = async (doctorId) => {
    if (!connectionReason.trim()) {
      setError('Please provide a reason for consultation');
      return;
    }

    try {
      await api.post('/api/connection-requests', {
        doctorId,
        reason: connectionReason
      });
      
      // Update UI to show pending status
      setDoctors(doctors.map(doc => 
        doc._id === doctorId 
          ? { ...doc, connectionStatus: 'pending' }
          : doc
      ));
      setSelectedDoctor(null);
      setConnectionReason('');
    } catch (err) {
      console.error('Connection request error:', err);
      setError(err.response?.data?.message || 'Failed to send connection request');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name && doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = !specialization || 
      (doctor.specialization && doctor.specialization.toLowerCase() === specialization.toLowerCase());
    return matchesSearch && matchesSpecialization;
  });

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Find a Doctor</h1>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search by Name
            </label>
            <input
              type="text"
              id="search"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter doctor's name"
            />
          </div>
          <div>
            <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
              Filter by Specialization
            </label>
            <select
              id="specialization"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            >
              <option value="">All Specializations</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Gynecologist">Gynecologist</option>
              <option value="Neurologist">Neurologist</option>
              <option value="Orthopedist">Orthopedist</option>
              <option value="Psychiatrist">Psychiatrist</option>
              <option value="Endocrinologist">Endocrinologist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor._id}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr. {doctor.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {doctor.specialization}
                  </p>
                </div>
                {doctor.rating && (
                  <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md">
                    <span className="text-blue-700 text-sm font-medium">
                      ★ {doctor.rating}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Experience:</span> {doctor.experience} years
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Languages:</span> {doctor.languages ? doctor.languages.join(', ') : 'Not specified'}
                </p>
                {doctor.education && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Education:</span> {doctor.education}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setSelectedDoctor(doctor)}
                  disabled={doctor.connectionStatus === 'pending'}
                  className={`w-full inline-flex justify-center items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium 
                    ${doctor.connectionStatus === 'pending'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                    }`}
                >
                  {doctor.connectionStatus === 'pending' ? 'Request Pending' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No doctors found matching your criteria.
        </div>
      )}

      {/* Connection Request Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Connect with Dr. {selectedDoctor.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Consultation
              </label>
              <textarea
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Please describe your medical concern..."
                value={connectionReason}
                onChange={(e) => setConnectionReason(e.target.value)}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleConnect(selectedDoctor._id)}
                disabled={!connectionReason.trim()}
                className="flex-1 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Send Request
              </button>
              <button
                onClick={() => {
                  setSelectedDoctor(null);
                  setConnectionReason('');
                }}
                className="flex-1 inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindDoctor; 