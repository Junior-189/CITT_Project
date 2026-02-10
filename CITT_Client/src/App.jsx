import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Hero from './components/Hero';
import About from './components/About';

// ✅ Page Imports
import Projects from './Pages/Projects';
import MyProjects from './Pages/MyProjects';
import Funding from './Pages/Funding';
import IP from './Pages/IPManagement';
import Events from './Pages/Events';
import Login from './Pages/Login';
import Register from './Pages/Register';
import SetPassword from './Pages/SetPassword';
import Unauthorized from './Pages/Unauthorized';
import UserProfile from './Pages/UserProfile';
import PersonalProfile from './Pages/PersonalProfile';
import MySubmissions from './Pages/MySubmissions';
import NotFoundPage from './Pages/NotFoundPage';

// ✅ Dashboard Imports
import AdminDashboard from './Pages/dashboards/AdminDashboard';
import SuperAdminDashboard from './Pages/dashboards/SuperAdminDashboard';
import IPManagerDashboard from './Pages/dashboards/IPManagerDashboard';

// ✅ Admin Pages
import UserManagement from './Pages/admin/UserManagement';
import ProjectApprovals from './Pages/admin/ProjectApprovals';
import AdminAnalytics from './Pages/admin/Analytics';
import FundingManagement from './Pages/admin/FundingManagement';
import AdminSubmissions from './Pages/admin/AdminSubmissions';
import AdminGallery from './Pages/admin/AdminGallery';

// ✅ Gallery Page
import Gallery from './Pages/Gallery';

// ✅ SuperAdmin Pages
import RoleManagement from './Pages/superadmin/RoleManagement';
import SystemStats from './Pages/superadmin/SystemStats';
import AuditLogs from './Pages/superadmin/AuditLogs';
import DatabaseInfo from './Pages/superadmin/DatabaseInfo';
import Analytics from './Pages/superadmin/Analytics';
import PastUsers from './Pages/superadmin/PastUsers';
import Permissions from './Pages/superadmin/Permissions';

// ✅ IP Manager Pages
import IPRecords from './Pages/ipmanager/IPRecords';
import PendingApprovals from './Pages/ipmanager/PendingApprovals';
import IPStatistics from './Pages/ipmanager/Statistics';
import IPAnalytics from './Pages/ipmanager/Analytics';
import SubmittedIPs from './Pages/ipmanager/SubmittedIPs';
import SubmittedProjects from './Pages/ipmanager/SubmittedProjects';

// ✅ Auth Imports
import { AuthProvider } from './context/AuthContext';
import { ServerAuthProvider } from './Pages/ServerAuthContext';
import { LanguageProvider } from './context/LanguageContext';
import {
  ProtectedRoute,
  PublicRoute,
  AdminRoute,
  SuperAdminRoute,
  IPManagerRoute
} from './components/RoleBasedRoute';

const App = () => (
  <LanguageProvider>
    <AuthProvider>
      <ServerAuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Hero />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/gallery" element={<Gallery />} />

              {/* Protected Routes - All authenticated users */}
              <Route path="/set-password" element={<ProtectedRoute><SetPassword /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
              <Route path="/funding" element={<ProtectedRoute><Funding /></ProtectedRoute>} />
              <Route path="/ip" element={<ProtectedRoute><IP /></ProtectedRoute>} />
              <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><PersonalProfile /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/my-submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />

              {/* Admin Routes - Admin and SuperAdmin */}
              <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="/admin/projects" element={<AdminRoute><ProjectApprovals /></AdminRoute>} />
              <Route path="/admin/funding" element={<AdminRoute><FundingManagement /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
              <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissions /></AdminRoute>} />
              <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />

              {/* SuperAdmin Routes - SuperAdmin only */}
              <Route path="/superadmin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
              <Route path="/superadmin/users" element={<SuperAdminRoute><RoleManagement /></SuperAdminRoute>} />
              <Route path="/superadmin/system" element={<SuperAdminRoute><SystemStats /></SuperAdminRoute>} />
              <Route path="/superadmin/audit-logs" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />
              <Route path="/superadmin/database" element={<SuperAdminRoute><DatabaseInfo /></SuperAdminRoute>} />
              <Route path="/superadmin/analytics" element={<SuperAdminRoute><Analytics /></SuperAdminRoute>} />
              <Route path="/superadmin/past-users" element={<SuperAdminRoute><PastUsers /></SuperAdminRoute>} />
              <Route path="/superadmin/permissions" element={<SuperAdminRoute><Permissions /></SuperAdminRoute>} />

              {/* IP Manager Routes - IPManager only */}
              <Route path="/ipmanager/dashboard" element={<IPManagerRoute><IPManagerDashboard /></IPManagerRoute>} />
              <Route path="/ipmanager/records" element={<IPManagerRoute><IPRecords /></IPManagerRoute>} />
              <Route path="/ipmanager/pending" element={<IPManagerRoute><PendingApprovals /></IPManagerRoute>} />
              <Route path="/ipmanager/statistics" element={<IPManagerRoute><IPStatistics /></IPManagerRoute>} />
              <Route path="/ipmanager/analytics" element={<IPManagerRoute><IPAnalytics /></IPManagerRoute>} />
              <Route path="/ipmanager/submitted-ips" element={<IPManagerRoute><SubmittedIPs /></IPManagerRoute>} />
              <Route path="/ipmanager/submitted-projects" element={<IPManagerRoute><SubmittedProjects /></IPManagerRoute>} />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </ServerAuthProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default App;
