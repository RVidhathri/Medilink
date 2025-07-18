import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import VitalsPage from './pages/VitalsPage';
import DietPlan from './pages/DietPlan';
import PregnancyTracker from './pages/PregnancyTracker';
import Chat from './pages/Chat';
import FindDoctor from './pages/FindDoctor';
import HealthRecords from './pages/HealthRecords';
import AddHealthRecord from './pages/AddHealthRecord';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

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
              
              <Route path="/add-health-record" element={
                <PrivateRoute role="patient">
                  <AddHealthRecord />
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