import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);
  
  useEffect(() => {
    if (profile) {
      initializeFormData();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProfile(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };
  
  const initializeFormData = () => {
    const data = {
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.address || '',
      bio: profile.bio || ''
    };
    
    if (profile.role === 'doctor') {
      data.specialization = profile.specialization || '';
      data.experience = profile.experience || '';
      data.education = profile.education || '';
      data.languages = Array.isArray(profile.languages) 
        ? profile.languages.join(', ') 
        : profile.languages || '';
      data.licenseNumber = profile.licenseNumber || '';
    } else if (profile.role === 'patient') {
      data.bloodType = profile.bloodType || '';
      data.allergies = Array.isArray(profile.allergies) 
        ? profile.allergies.join(', ') 
        : profile.allergies || '';
      data.medicalConditions = Array.isArray(profile.medicalConditions) 
        ? profile.medicalConditions.join(', ') 
        : profile.medicalConditions || '';
      data.age = profile.age || '';
    }
    
    setFormData(data);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    setSaveSuccess(false);
    
    try {
      // Process form data for submission
      const dataToSubmit = { ...formData };
      
      // Convert comma-separated strings to arrays where needed
      if (profile.role === 'doctor' && dataToSubmit.languages) {
        dataToSubmit.languages = dataToSubmit.languages;
      }
      
      if (profile.role === 'patient') {
        if (dataToSubmit.allergies) {
          dataToSubmit.allergies = dataToSubmit.allergies.split(',').map(item => item.trim());
        }
        if (dataToSubmit.medicalConditions) {
          dataToSubmit.medicalConditions = dataToSubmit.medicalConditions.split(',').map(item => item.trim());
        }
      }
      
      const response = await axios.put(`/api/users/${user.id}`, dataToSubmit, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setProfile(response.data);
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <div className="text-center">Loading profile...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!profile) return <div className="text-center">No profile data found.</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>
      
      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">Profile updated successfully!</p>
        </div>
      )}
      
      {saveError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{saveError}</p>
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                {profile.role === 'patient' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {profile.role === 'doctor' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Experience (years)</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Education</label>
                    <input
                      type="text"
                      name="education"
                      value={formData.education}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Languages (comma-separated)</label>
                    <input
                      type="text"
                      name="languages"
                      value={formData.languages}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">License Number</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {profile.role === 'patient' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Blood Type</label>
                    <select
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Allergies (comma-separated)</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Peanuts, Shellfish, Penicillin"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Medical Conditions (comma-separated)</label>
                    <textarea
                      name="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., Asthma, Diabetes, Hypertension"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-gray-900">{profile.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{profile.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <p className="mt-1 text-gray-900 capitalize">{profile.role}</p>
              </div>
              {profile.age && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Age</label>
                  <p className="mt-1 text-gray-900">{profile.age} years</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>

          {profile.role === 'doctor' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Specialization</label>
                  <p className="mt-1 text-gray-900">{profile.specialization}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Experience</label>
                  <p className="mt-1 text-gray-900">{profile.experience} years</p>
                </div>
                {profile.education && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Education</label>
                    <p className="mt-1 text-gray-900">{profile.education}</p>
                  </div>
                )}
                {profile.languages && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Languages</label>
                    <p className="mt-1 text-gray-900">
                      {Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500">License Number</label>
                  <p className="mt-1 text-gray-900">{profile.licenseNumber || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {profile.role === 'patient' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Blood Type</label>
                  <p className="mt-1 text-gray-900">{profile.bloodType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Allergies</label>
                  <p className="mt-1 text-gray-900">
                    {Array.isArray(profile.allergies) && profile.allergies.length > 0 
                      ? profile.allergies.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Medical Conditions</label>
                  <p className="mt-1 text-gray-900">
                    {Array.isArray(profile.medicalConditions) && profile.medicalConditions.length > 0 
                      ? profile.medicalConditions.join(', ') 
                      : 'None reported'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile; 