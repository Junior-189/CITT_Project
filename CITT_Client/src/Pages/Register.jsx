import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Attempting registration with:', name, email, password, confirmPassword); // DEBUG
      const result = await register(name, email, password, confirmPassword);
      console.log('Registration response:', result); // DEBUG
      setError('');
    } catch (err) {
      console.error('Registration error:', err); // DEBUG
      setError(err.response?.data?.message || err.message || 'Registration failed');
    }
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
          <h2 className="text-3xl font-bold mb-6 text-teal-300 text-center">
            Register for ITTMS
          </h2>
          {error && (
            <p className="text-red-400 mb-4 text-center">{error}</p>
          )}
          <div className="flex justify-center">
            <div className="bg-white bg-opacity-20 rounded-lg p-6 w-full max-w-sm">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-teal-300 mb-2" htmlFor="name">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              <div className="mb-4">
                <label className="block text-teal-300 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-teal-300 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-slate-800 border-2 border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="Enter your password"
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
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-5 py-2.5 bg-teal-600 text-white border-none rounded-md cursor-pointer hover:bg-teal-700 transition-colors font-semibold"
              >
                Register
              </button>
              <p className="mt-4 text-center text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-teal-300 hover:underline">
                  Login
                </a>
              </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;