import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenuBar from './UserMenuBar';
import { Menu, X } from 'lucide-react';

const TopNavbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { profile, role } = useAuth();

  const isAuthenticated = !!profile;

  const getDashboardTitle = () => {
    switch (role) {
      case 'superAdmin': return 'Super Admin Dashboard';
      case 'admin': return 'Admin Dashboard';
      case 'transferTechnologyOfficer': return 'Transfer Technology Officer';
      case 'ipManager': return 'IP Manager Dashboard';
      case 'diiDirector': return 'DII Director Workspace';
      case 'debmDirector': return 'DEBM Director Workspace';
      case 'rtpDirector': return 'RTP Director Workspace';
      case 'mentor': return 'Mentor Dashboard';
      case 'technicalCommittee': return 'Technical Committee';
      case 'coordinator': return 'Coordinator Dashboard';
      case 'innovator': return 'CITT Management System';
      default: return 'CITT Management System';
    }
  };

  return (
    <nav className="bg-gradient-to-r from-slate-800 to-teal-700 shadow-lg">
      <div className="px-4 md:px-6">
        <div className="flex justify-between items-center h-16">

          {/* Left side — Mobile hamburger + Logo */}
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? (
                <X size={22} className="text-white" />
              ) : (
                <Menu size={22} className="text-white" />
              )}
            </button>
            <Link to="/" className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-teal-700 font-bold text-base">C</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-white font-bold text-base leading-tight whitespace-nowrap">
                  {getDashboardTitle()}
                </h1>
                <p className="text-white/60 text-xs whitespace-nowrap">
                  Innovation & Technology Transfer
                </p>
              </div>
            </Link>
          </div>

          {/* Right side — User Menu */}
          <div className="flex items-center flex-shrink-0">
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
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors text-sm font-medium"
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
