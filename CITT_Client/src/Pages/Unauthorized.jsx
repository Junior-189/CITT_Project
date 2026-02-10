import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { role, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    // Redirect to appropriate dashboard based on role
    if (role === 'superAdmin') {
      navigate('/superadmin/dashboard');
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'ipManager') {
      navigate('/ipmanager/dashboard');
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1f33] to-[#1a3a52] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-teal-400 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-300 mb-2">
            You don't have permission to access this page.
          </p>

          {role && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mt-4 border border-white/20">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold text-white">Current Role:</span>{' '}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                  {role}
                </span>
              </p>
              {profile?.name && (
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">User:</span>{' '}
                  {profile.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 border border-white/30"
          >
            Go to Dashboard
          </button>

          <Link
            to="/"
            className="block w-full text-center text-teal-400 hover:text-teal-300 font-medium py-2 transition duration-200"
          >
            Return to Home
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Need access to this page?
          </p>
          <p className="text-xs text-gray-500">
            Contact your administrator to request the necessary permissions.
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">
            💡 Why am I seeing this?
          </h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• You may not have the required role for this page</li>
            <li>• The page may be restricted to admins only</li>
            <li>• Your account permissions may have changed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
