import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-primary shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to={`/${user.role}-dashboard`} className="text-white font-bold text-xl">
            Healthcare Portal
          </Link>
          
          <div className="flex items-center space-x-4">
            {user.role === 'patient' && (
              <>
                <Link to="/vitals" className="text-white hover:text-gray-200">
                  Vitals
                </Link>
                <Link to="/diet-plan" className="text-white hover:text-gray-200">
                  Diet Plan
                </Link>
                <Link to="/pregnancy-tracker" className="text-white hover:text-gray-200">
                  Pregnancy Tracker
                </Link>
              </>
            )}
            
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 