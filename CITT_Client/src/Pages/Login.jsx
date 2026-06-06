import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ROLE_ROUTES = {
  superAdmin:                '/superadmin/dashboard',
  admin:                     '/admin/dashboard',
  transferTechnologyOfficer: '/admin/dashboard',
  ipManager:                 '/ipmanager/dashboard',
  diiDirector:               '/dii/workspace',
  debmDirector:              '/debm/workspace',
  rtpDirector:               '/rtp/workspace',
  mentor:                    '/workspace/mentor',
  technicalCommittee:        '/workspace/technical-committee',
  coordinator:               '/workspace/coordinator',
  innovator:                 '/projects',
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    navigate(ROLE_ROUTES[role] || '/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');
    try {
      const userData = await login(email, password);
      redirectByRole(userData.role);
    } catch (err) {
      const code = err.response?.data?.error || '';
      const msg = err.response?.data?.message || err.message || '';
      if (code === 'account_pending') {
        setPendingMessage(msg || 'Your account is awaiting admin approval.');
      } else if (code === 'account_rejected') {
        setError(msg || 'Your account has been rejected. Please contact the administrator.');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setPendingMessage('');
    try {
      const userData = await loginWithGoogle();
      redirectByRole(userData.role);
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    }
  };

  return (
    <section className="relative min-h-screen py-16 px-5 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/must-campus.jpg)', zIndex: -2 }}
      />
      <div className="absolute inset-0 bg-slate-900 opacity-85" style={{ zIndex: -1 }} />

      <div className="relative max-w-md w-full mx-auto text-white">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-teal-600/40">
          <h2 className="text-3xl font-bold mb-6 text-teal-300 text-center">
            Login to ITTMS
          </h2>

          {error && (
            <div className="mb-4 bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {pendingMessage && (
            <div className="mb-4 bg-amber-900 bg-opacity-50 border border-amber-500 rounded-lg p-4">
              <p className="text-amber-200 text-sm font-semibold mb-1">Account Pending Approval</p>
              <p className="text-amber-100 text-sm">{pendingMessage}</p>
              <button
                onClick={() => { setPendingMessage(''); setEmail(''); setPassword(''); }}
                className="mt-3 text-xs text-amber-300 hover:text-white underline"
              >
                Use a different account
              </button>
            </div>
          )}

          <div className="flex justify-center">
            <div className="bg-slate-800/80 rounded-lg p-6 w-full max-w-sm">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-teal-200 text-sm font-medium mb-1.5" htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/60 border border-teal-500 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-teal-200 text-sm font-medium mb-1.5" htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700/60 border border-teal-500 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-5 py-2.5 bg-teal-600 text-white border-none rounded-md cursor-pointer hover:bg-teal-700 transition-colors font-semibold"
                >
                  Login
                </button>
              </form>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-white border-opacity-30" />
                <span className="px-4 text-sm text-white opacity-70">OR</span>
                <div className="flex-1 border-t border-white border-opacity-30" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-2.5 bg-white text-slate-700 border-none rounded-md cursor-pointer hover:bg-gray-100 transition-colors font-semibold"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.879 15.7789 19.9895 13.221 19.9895 10.1871Z" fill="#4285F4"/>
                  <path d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9465L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z" fill="#34A853"/>
                  <path d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z" fill="#FBBC05"/>
                  <path d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z" fill="#EB4335"/>
                </svg>
                Continue with Google
              </button>

              <p className="mt-4 text-center text-slate-300 text-sm">
                Don't have an account?{' '}
                <a href="/register" className="text-teal-400 hover:underline font-semibold">Register</a>
              </p>
              <p className="mt-2 text-center">
                <a href="/reset-password" className="text-teal-400 hover:underline text-sm">Forgot Password?</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
