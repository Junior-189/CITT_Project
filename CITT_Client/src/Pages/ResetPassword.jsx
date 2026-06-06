import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const [step, setStep] = useState('request'); // 'request' | 'sent' | 'reset' | 'success'
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for token in URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setStep('reset');
    }
  }, []);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim().toLowerCase() });
      setStep('sent');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { setError('Password must contain an uppercase letter'); return; }
    if (!/[a-z]/.test(newPassword)) { setError('Password must contain a lowercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { setError('Password must contain a number'); return; }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) { setError('Password must contain a special character'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token: resetToken, newPassword });
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may be expired.');
    }
    setLoading(false);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/must-campus.jpg)', zIndex: -2 }} />
      <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }} />
      <div className="relative max-w-md w-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 border border-teal-600/40 shadow-2xl">
        {step === 'request' && (
          <>
            <h2 className="text-3xl font-bold text-teal-300 text-center mb-6">Reset Password</h2>
            <p className="text-slate-300 text-sm mb-6 text-center">Enter your email and we'll send you a reset link.</p>
            {error && <div className="mb-4 bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">{error}</div>}
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-teal-300 text-sm mb-1">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-teal-500 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 disabled:opacity-50 text-white font-semibold rounded-lg transition">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-gray-400 text-sm">
                <Link to="/login" className="text-teal-300 hover:underline">Back to Login</Link>
              </p>
            </form>
          </>
        )}

        {step === 'sent' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-teal-300 mb-3">Check Your Email</h2>
            <p className="text-white text-sm leading-relaxed mb-6">
              If an account with that email exists, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <Link to="/login" className="block w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-center">
              Back to Login
            </Link>
          </div>
        )}

        {step === 'reset' && (
          <>
            <h2 className="text-3xl font-bold text-teal-300 text-center mb-6">Set New Password</h2>
            {error && <div className="mb-4 bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">{error}</div>}
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-teal-300 text-sm mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  placeholder="Enter new password"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-teal-500 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              </div>
              <div>
                <label className="block text-teal-300 text-sm mb-1">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Repeat new password"
                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-teal-500 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 disabled:opacity-50 text-white font-semibold rounded-lg transition">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-teal-300 mb-3">Password Reset</h2>
            <p className="text-white text-sm leading-relaxed mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Link to="/login" className="block w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-center">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResetPassword;
