import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile, setPassword: setUserPassword } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if not logged in
  if (!user || !profile) {
    return (
      <section className="relative min-h-screen py-16 px-5 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/must-campus.jpg)',
            zIndex: -2
          }}
        ></div>
        <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }}></div>

        <div className="relative max-w-md w-full mx-auto text-white">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white border-opacity-20">
            <h2 className="text-2xl font-bold mb-4 text-teal-300 text-center">
              Access Denied
            </h2>
            <p className="text-center text-slate-200 mb-6">
              You must be logged in to set your password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full px-5 py-2.5 bg-teal-600 text-white border-none rounded-md cursor-pointer hover:bg-teal-700 transition-colors font-semibold"
            >
              Go to Login
            </button>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await setUserPassword(password);
      setSuccess('Password set successfully!');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to set password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <section className="relative min-h-screen py-16 px-5 flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/must-campus.jpg)',
          zIndex: -2
        }}
      ></div>
      <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }}></div>

      {/* Content */}
      <div className="relative max-w-md w-full mx-auto text-white">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white border-opacity-20">
          <h2 className="text-3xl font-bold mb-2 text-teal-300 text-center">
            Set Your Password
          </h2>
          <p className="text-center text-slate-300 mb-6 text-sm">
            You logged in with Google. Set a password to login with your email next time.
          </p>

          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-20 border border-green-400 text-green-200 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <div className="flex justify-center">
            <div className="bg-white bg-opacity-20 rounded-lg p-6 w-full max-w-sm">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-teal-300 mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-slate-400 focus:outline-none bg-slate-200 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">Your email cannot be changed</p>
                </div>

                <div className="mb-4">
                  <label className="block text-teal-300 mb-2" htmlFor="password">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-teal-300 mb-2" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-2.5 bg-teal-600 text-white border-none rounded-md cursor-pointer hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Setting Password...' : 'Set Password'}
                </button>
              </form>

              <p className="mt-4 text-center text-slate-300 text-sm">
                You can set this later from your profile settings too.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SetPassword;
