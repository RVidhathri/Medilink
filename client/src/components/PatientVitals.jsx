import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../utils/api';
import PropTypes from 'prop-types';

const PatientVitals = ({ patientId }) => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVitals = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/vitals/${patientId}`);
        setVitals(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching vitals:', err);
        setError('Failed to load patient vitals');
        setLoading(false);
      }
    };

    if (patientId) {
      fetchVitals();
    }
  }, [patientId]);

  if (loading) return <div className="text-center py-4">Loading vitals...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;
  if (vitals.length === 0) return <div className="text-center py-4">No vitals recorded for this patient.</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Vitals History</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Blood Pressure
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Heart Rate
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Temperature
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oxygen Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Glucose Level
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vitals.map((vital, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(vital.date || vital.recordedAt), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {vital.bloodPressure?.systolic}/{vital.bloodPressure?.diastolic} mmHg
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vital.heartRate} bpm
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vital.temperature}°C
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vital.oxygenLevel || 'N/A'}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {vital.glucoseLevel || 'N/A'} mg/dL
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

PatientVitals.propTypes = {
  patientId: PropTypes.string.isRequired
};

export default PatientVitals; 