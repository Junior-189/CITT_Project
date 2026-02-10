import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenuBar from './UserMenuBar';

const TopNavbar = ({ toggleSidebar }) => {
  const { profile, role } = useAuth();

  const isAuthenticated = !!profile;

  const getDashboardTitle = () => {
    switch (role) {
      case 'superAdmin':
        return 'Super Admin Dashboard';
      case 'admin':
        return 'Admin Dashboard';
      case 'ipManager':
        return 'IP Manager Dashboard';
      case 'innovator':
        return 'CITT Management System';
      default:
        return 'CITT Management System';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-teal-700 shadow-lg">
      <div className="mx-auto px-16">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Sidebar Toggle, Logo and Title */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button - Three line icon */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <span className="text-teal-700 font-bold text-lg">C</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-white font-bold text-lg">
                  {getDashboardTitle()}
                </h1>
                <p className="text-white/70 text-xs">
                  Innovation & Technology Transfer
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <UserMenuBar />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
