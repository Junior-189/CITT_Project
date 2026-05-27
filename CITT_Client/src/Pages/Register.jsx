import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const passwordRules = [
  { id: 'length',  label: 'At least 8 characters',         test: (p) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',     test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',     test: (p) => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number (0–9)',               test: (p) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

const Register = () => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passResults = passwordRules.map(r => ({ ...r, passed: r.test(form.password) }));
  const allPassed = passResults.every(r => r.passed);

  const handleChange = (e) => setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!allPassed) { setError('Password does not meet all requirements.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-5 py-16">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/must-campus.jpg)', zIndex: -2 }} />
        <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }} />
        <div className="relative max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
          <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-teal-300 mb-3">Registration Submitted</h2>
          <p className="text-white text-sm leading-relaxed mb-6">
            Your account has been created and is awaiting admin approval.<br />
            You will be able to log in once an administrator approves your account.
          </p>
          <Link to="/login" className="block w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-center">
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/must-campus.jpg)', zIndex: -2 }} />
      <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }} />
      <div className="relative max-w-md w-full bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-white">
        <h2 className="text-3xl font-bold text-teal-300 text-center mb-6">Create Account</h2>
        {error && <div className="mb-4 bg-red-900/50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-teal-300 text-sm mb-1">Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Enter your full name"
              className="w-full px-3 py-2 rounded-lg bg-white/20 border border-teal-400 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
          </div>
          <div>
            <label className="block text-teal-300 text-sm mb-1">Phone Number</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+255 700 000 000"
              className="w-full px-3 py-2 rounded-lg bg-white/20 border border-teal-400 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
          </div>
          <div>
            <label className="block text-teal-300 text-sm mb-1">Email Address</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg bg-white/20 border border-teal-400 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
          </div>
          <div>
            <label className="block text-teal-300 text-sm mb-1">Password</label>
            <div className="relative">
              <input name="password" type={showPass ? 'text' : 'password'} value={form.password}
                onChange={handleChange}
                onFocus={() => setShowRules(true)}
                onBlur={() => setShowRules(false)}
                required placeholder="Create a strong password"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-white/20 border border-teal-400 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300 hover:text-white">
                {showPass
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
            {(showRules || form.password.length > 0) && (
              <div className="mt-2 bg-slate-800/90 border border-slate-600 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2 font-semibold">Password must contain:</p>
                <div className="space-y-1">
                  {passResults.map(r => (
                    <div key={r.id} className="flex items-center gap-2">
                      {r.passed
                        ? <svg className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      }
                      <span className={`text-xs ${r.passed ? 'text-teal-400' : 'text-slate-400'}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-teal-300 text-sm mb-1">Confirm Password</label>
            <div className="relative">
              <input name="confirmPassword" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={handleChange} required placeholder="Repeat your password"
                className="w-full px-3 py-2 pr-10 rounded-lg bg-white/20 border border-teal-400 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm" />
              <button type="button" onClick={() => setShowConfirm(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300 hover:text-white">
                {showConfirm
                  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !allPassed}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-900 disabled:opacity-50 text-white font-semibold rounded-lg transition mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-300 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default Register;
