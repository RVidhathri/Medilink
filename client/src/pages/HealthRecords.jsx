import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';

const HealthRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [newRecord, setNewRecord] = useState({
    title: '',
    description: '',
    condition: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [user]);

  const fetchRecords = async () => {
    try {
      const response = await axios.get(`/api/health-records/${user.id}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch health records');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRecord(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/health-records', {
        ...newRecord,
        patientId: user.id
      });
      toast.success('Health record added successfully');
      setNewRecord({
        title: '',
        description: '',
        condition: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchRecords();
    } catch (error) {
      console.error('Error adding record:', error);
      toast.error('Failed to add health record');
    }
    setLoading(false);
  };

  const handleDelete = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/health-records/${recordId}`);
        toast.success('Record deleted successfully');
        fetchRecords();
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Failed to delete record');
      }
    }
  };

  const handleShare = async (recordId) => {
    try {
      await axios.post(`/api/health-records/${recordId}/share`);
      toast.success('Record shared with connected doctors');
    } catch (error) {
      console.error('Error sharing record:', error);
      toast.error('Failed to share record');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold mb-6">Health Records</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={newRecord.title}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={newRecord.description}
              onChange={handleInputChange}
              required
              rows="3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Condition</label>
            <input
              type="text"
              name="condition"
              value={newRecord.condition}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={newRecord.date}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Record'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="grid gap-4 p-6">
          {records.map(record => (
            <div key={record._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{record.title}</h3>
                  <p className="text-gray-600">{new Date(record.date).toLocaleDateString()}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleShare(record._id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => handleDelete(record._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2"><strong>Condition:</strong> {record.condition}</p>
              <p className="mt-2">{record.description}</p>
            </div>
          ))}
          {records.length === 0 && (
            <p className="text-center text-gray-500">No health records found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HealthRecords; 