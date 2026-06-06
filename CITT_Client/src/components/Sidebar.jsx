import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getRoleDotClass } from '../utils/roleColors';
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
  Image,
  Building2,
  UserCheck,
  Briefcase,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { profile, role } = useAuth();
  const location = useLocation();

  const isAuthenticated = !!profile;

  const isActive = (path) => location.pathname === path;

  const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/about', label: 'About', icon: Info },
    { path: '/projects', label: 'Projects', icon: FolderKanban, protected: true },
    { path: '/funding', label: 'Funding', icon: DollarSign, protected: true },
    { path: '/ip', label: 'IP Management', icon: FileText, protected: true },
    { path: '/events', label: 'Events', icon: Calendar, protected: true },
    { path: '/workspace', label: 'Workspace', icon: Briefcase, protected: true },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const superAdminNavItems = [
    { path: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/superadmin/users', label: 'Role Management', icon: UserCog },
    { path: '/superadmin/past-users', label: 'Past Users', icon: Clock },
    { path: '/superadmin/permissions', label: 'Permissions', icon: Lock },
    { path: '/superadmin/system', label: 'System Stats', icon: Database },
    { path: '/superadmin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/superadmin/audit-logs', label: 'Audit Logs', icon: FileBarChart },
    { path: '/superadmin/database', label: 'Database Info', icon: Settings },
    { path: '/departments', label: 'Departments', icon: Building2 },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/projects', label: 'Project Approvals', icon: FolderKanban },
    { path: '/admin/assignments', label: 'Project Assignments', icon: UserCheck },
    { path: '/admin/funding', label: 'Funding Management', icon: DollarSign },
    { path: '/events', label: 'Events', icon: Calendar },
    { path: '/admin/gallery', label: 'Gallery', icon: Image },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: FileBarChart },
    { path: '/workspace', label: 'Workspace Portal', icon: Briefcase },
    { path: '/departments', label: 'Departments', icon: Building2 },
  ];

  const ipManagerNavItems = [
    { path: '/ipmanager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/ipmanager/submitted-ips', label: 'Submitted IPs', icon: FileText },
    { path: '/ipmanager/submitted-projects', label: 'Submitted Projects', icon: FolderKanban },
    { path: '/ipmanager/records', label: 'IP Records', icon: FileText },
    { path: '/ipmanager/pending', label: 'Pending Approvals', icon: Clock },
    { path: '/ipmanager/statistics', label: 'Statistics', icon: Database },
    { path: '/ipmanager/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const diiDirectorNavItems = [
    { path: '/dii/dashboard', label: 'DII Dashboard', icon: LayoutDashboard },
    { path: '/dii/workspace', label: 'DII Workspace', icon: Building2 },
    { path: '/dii/projects', label: 'Submitted Projects', icon: FolderKanban },
    { path: '/dii/assignments', label: 'Assignments', icon: UserCheck },
    { path: '/departments', label: 'Departments', icon: Building2 },
  ];

  const debmDirectorNavItems = [
    { path: '/debm/dashboard', label: 'DEBM Dashboard', icon: LayoutDashboard },
    { path: '/debm/workspace', label: 'DEBM Workspace', icon: Building2 },
    { path: '/debm/projects', label: 'Projects', icon: FolderKanban },
    { path: '/departments', label: 'Departments', icon: Building2 },
  ];

  const rtpDirectorNavItems = [
    { path: '/rtp/dashboard', label: 'RTP Dashboard', icon: LayoutDashboard },
    { path: '/rtp/workspace', label: 'RTP Workspace', icon: Building2 },
    { path: '/rtp/projects', label: 'Rural Projects', icon: FolderKanban },
    { path: '/departments', label: 'Departments', icon: Building2 },
  ];

  const mentorNavItems = [
    { path: '/workspace', label: 'Workspace Portal', icon: Briefcase },
    { path: '/workspace/mentor', label: 'Mentor Workspace', icon: LayoutDashboard },
    { path: '/mentor/dashboard', label: 'Mentor Dashboard', icon: LayoutDashboard },
    { path: '/mentor/projects', label: 'My Assigned Projects', icon: FolderKanban },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const technicalCommitteeNavItems = [
    { path: '/workspace', label: 'Workspace Portal', icon: Briefcase },
    { path: '/workspace/technical-committee', label: 'TC Workspace', icon: LayoutDashboard },
    { path: '/tc/dashboard', label: 'TC Dashboard', icon: LayoutDashboard },
    { path: '/tc/projects', label: 'Assigned Projects', icon: FolderKanban },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const coordinatorNavItems = [
    { path: '/workspace', label: 'Workspace Portal', icon: Briefcase },
    { path: '/workspace/coordinator', label: 'Coordinator Workspace', icon: LayoutDashboard },
    { path: '/coordinator/dashboard', label: 'Coordinator Dashboard', icon: LayoutDashboard },
    { path: '/coordinator/projects', label: 'All Projects', icon: FolderKanban },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const getNavItems = () => {
    if (!isAuthenticated) return publicNavItems.filter(item => !item.protected);
    switch (role) {
      case 'superAdmin': return superAdminNavItems;
      case 'admin': return adminNavItems;
      case 'transferTechnologyOfficer': return adminNavItems;
      case 'ipManager': return ipManagerNavItems;
      case 'diiDirector': return diiDirectorNavItems;
      case 'debmDirector': return debmDirectorNavItems;
      case 'rtpDirector': return rtpDirectorNavItems;
      case 'mentor': return mentorNavItems;
      case 'technicalCommittee': return technicalCommitteeNavItems;
      case 'coordinator': return coordinatorNavItems;
      case 'innovator': return publicNavItems;
      default: return publicNavItems.filter(item => !item.protected);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'superAdmin': return 'Super Admin';
      case 'admin': return 'Administrator';
      case 'transferTechnologyOfficer': return 'Tech. Transfer Officer';
      case 'ipManager': return 'IP Manager';
      case 'diiDirector': return 'DII Director';
      case 'debmDirector': return 'DEBM Director';
      case 'rtpDirector': return 'RTP Director';
      case 'mentor': return 'Mentor';
      case 'technicalCommittee': return 'Technical Committee';
      case 'coordinator': return 'Coordinator';
      case 'innovator': return 'Innovator';
      default: return role || 'User';
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
          bg-white border-r-2 border-teal-600
          transition-all duration-300 ease-in-out
          flex flex-col flex-shrink-0
          z-40 h-full lg:h-screen
          lg:sticky lg:top-0
          ${isOpen
            ? 'w-64 absolute inset-y-0 left-0 lg:relative lg:inset-auto'
            : 'w-0 lg:w-14 lg:relative lg:inset-auto'
          }
        `}
        style={{ backgroundColor: '#ffffff' }}
      >
          {/* Sidebar Header */}
          <div className={`flex items-center border-b border-teal-100 transition-all duration-300 ${isOpen ? 'justify-between p-4' : 'justify-center p-3'}`}>

            {/* Logo and Branding — only visible when open */}
            {isOpen && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
                  CITT
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 leading-tight truncate">Centre for Innovation</span>
                  <span className="text-xs text-slate-500 leading-tight truncate">and Technology Transfer</span>
                </div>
              </div>
            )}

            {/* Toggle Button — desktop only (mobile uses hamburger in TopNavbar) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden lg:flex w-7 h-7 rounded-full bg-teal-600 hover:bg-teal-700 border-2 border-white shadow-md items-center justify-center transition-all duration-300 focus:outline-none shrink-0"
              aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {isOpen ? (
                <ChevronLeft size={16} className="text-white" />
              ) : (
                <ChevronRight size={16} className="text-white" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 bg-white overflow-x-hidden overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        active 
                          ? 'bg-teal-50 text-teal-600 font-medium' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      {isOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* Role Badge at bottom — always shown when sidebar has any width */}
          {isAuthenticated && (
            <div className={`border-t border-slate-200 bg-white transition-all duration-300 flex-shrink-0 ${isOpen ? 'p-4' : 'p-2'}`}
              style={{ backgroundColor: '#ffffff' }}
            >
              <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                {/* Role color dot */}
                <div className={`shrink-0 rounded-full flex items-center justify-center font-bold text-white w-8 h-8 text-xs ${getRoleDotClass(role)}`}
                >
                  {getRoleLabel().charAt(0).toUpperCase()}
                </div>

                {/* Role label and name — only when sidebar is open */}
                {isOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight truncate text-slate-700">
                      {getRoleLabel()}
                    </p>
                    {profile?.name && (
                      <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                        {profile.name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
    </>
  );
};

export default Sidebar;
