import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }
    api.post('/api/auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be expired.');
      });
  }, [searchParams]);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 py-16">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/must-campus.jpg)', zIndex: -2 }} />
      <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }} />
      <div className="relative max-w-md w-full bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 border border-teal-600/40 shadow-2xl text-center">
        {status === 'verifying' && (
          <div>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400 mx-auto mb-4" />
            <p className="text-teal-300">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-teal-300 mb-3">Email Verified</h2>
            <p className="text-white text-sm leading-relaxed mb-6">{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-300 mb-3">Verification Failed</h2>
            <p className="text-white text-sm leading-relaxed mb-6">{message}</p>
          </>
        )}
        <Link to="/login" className="block w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition text-center">
          Go to Login
        </Link>
      </div>
    </section>
  );
};

export default VerifyEmail;
