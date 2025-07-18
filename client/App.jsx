import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Pages
import Login from './src/pages/Login';
import Register from './src/pages/Register';
import DoctorDashboard from './src/pages/DoctorDashboard';
import PatientDashboard from './src/pages/PatientDashboard';
import VitalsPage from './src/pages/VitalsPage';
import DietPlan from './src/pages/DietPlan';
import PregnancyTracker from './src/pages/PregnancyTracker';
import Chat from './src/pages/Chat';
import FindDoctor from './src/pages/FindDoctor';
import HealthRecords from './src/pages/HealthRecords';

// Components
import Navbar from './src/components/Navbar';
import PrivateRoute from './src/components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/doctor-dashboard" element={
                <PrivateRoute role="doctor">
                  <DoctorDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/patient-dashboard" element={
                <PrivateRoute role="patient">
                  <PatientDashboard />
                </PrivateRoute>
              } />
              
              <Route path="/find-doctor" element={
                <PrivateRoute role="patient">
                  <FindDoctor />
                </PrivateRoute>
              } />
              
              <Route path="/vitals" element={
                <PrivateRoute>
                  <VitalsPage />
                </PrivateRoute>
              } />
              
              <Route path="/diet-plan" element={
                <PrivateRoute>
                  <DietPlan />
                </PrivateRoute>
              } />
              
              <Route path="/pregnancy-tracker" element={
                <PrivateRoute>
                  <PregnancyTracker />
                </PrivateRoute>
              } />
              
              <Route path="/chat/:userId" element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              } />

              <Route path="/health-records/:patientId?" element={
                <PrivateRoute>
                  <HealthRecords />
                </PrivateRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
