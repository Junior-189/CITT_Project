import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Info,
  FolderKanban,
  DollarSign,
  FileText,
  Calendar,
  Mail,
  LayoutDashboard,
  Users,
  Settings,
  Database,
  BarChart3,
  FileBarChart,
  Shield,
  UserCog,
  Clock,
  Lock,
  Image
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { profile, role } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!profile;

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Innovator/Public Navigation
  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: Info },
    { path: '/projects', label: 'Projects', icon: FolderKanban, protected: true },
    { path: '/my-projects', label: 'My Projects', icon: FolderKanban, protected: true },
    { path: '/funding', label: 'Funding', icon: DollarSign, protected: true },
    { path: '/ip', label: 'IP Management', icon: FileText, protected: true },
    { path: '/events', label: 'Events', icon: Calendar, protected: true },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  // SuperAdmin Navigation
  const superAdminNavItems = [
    { path: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/superadmin/users', label: 'Role Management', icon: UserCog },
    { path: '/superadmin/past-users', label: 'Past Users', icon: Clock },
    { path: '/superadmin/permissions', label: 'Permissions', icon: Lock },
    { path: '/superadmin/system', label: 'System Stats', icon: Database },
    { path: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: FileBarChart },
    { path: '/superadmin/database', label: 'Database Info', icon: Settings },
  ];

  // Admin Navigation
  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/projects', label: 'Project Approvals', icon: FolderKanban },
    { path: '/admin/funding', label: 'Funding Management', icon: DollarSign },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/admin/gallery', label: 'Gallery', icon: Image },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileBarChart },
  ];

  // IP Manager Navigation
  const ipManagerNavItems = [
    { path: '/ipmanager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/ipmanager/submitted-ips', label: 'Submitted IPs', icon: FileText },
    { path: '/ipmanager/submitted-projects', label: 'Submitted Projects', icon: FolderKanban },
    { path: '/ipmanager/records', label: 'IP Records', icon: FileText },
    { path: '/ipmanager/pending', label: 'Pending Approvals', icon: Clock },
    { path: '/ipmanager/statistics', label: 'Statistics', icon: Database },
    { path: '/ipmanager/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Determine which nav items to show
  const getNavItems = () => {
    if (!isAuthenticated) {
      return publicNavItems.filter(item => !item.protected);
    }

    switch (role) {
      case 'superAdmin':
        return superAdminNavItems;
      case 'admin':
        return adminNavItems;
      case 'ipManager':
        return ipManagerNavItems;
      case 'innovator':
        return publicNavItems;
      default:
        return publicNavItems.filter(item => !item.protected);
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative left-0 top-0 bottom-0 z-40
          bg-white border-r-2 border-teal-600
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-0 lg:w-16'}
          overflow-y-auto
          flex flex-col h-full lg:h-auto
        `}
      >
        {/* Sidebar Header */}
        <div className="flex flex-col items-center gap-4 p-4 border-b border-slate-200">
          <div className={`${isOpen ? 'w-[70px] h-[70px]' : 'w-10 h-10'} rounded-full bg-slate-800 flex items-center justify-center font-bold text-white transition-all duration-300`}>
            <span className={isOpen ? 'text-base' : 'text-xs'}>CITT</span>
          </div>
          {isOpen && (
            <div className="flex flex-col items-center text-center">
              <h1 className="text-sm font-bold text-slate-800">
                Centre for Innovation and Technology Transfer
              </h1>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-0 w-full overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  text-slate-700 font-semibold hover:bg-slate-100 transition-colors
                  px-4 py-3 border-b border-slate-200 w-full flex items-center gap-3
                  ${active ? 'bg-teal-50 border-l-4 border-l-teal-600 text-teal-700' : ''}
                  ${!isOpen ? 'justify-center' : ''}
                `}
                title={!isOpen ? item.label : ''}
              >
                <Icon className={`${isOpen ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} />
                {isOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge (when expanded) */}
        {isOpen && isAuthenticated && (
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-semibold text-slate-600">
                {role === 'superAdmin' && 'Super Administrator'}
                {role === 'admin' && 'Administrator'}
                {role === 'ipManager' && 'IP Manager'}
                {role === 'innovator' && 'Innovator'}
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
