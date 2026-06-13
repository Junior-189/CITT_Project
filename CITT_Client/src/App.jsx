import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Hero from './components/Hero';
import About from './components/About';

//Page Imports
import Projects from './Pages/Projects';
import Funding from './Pages/Funding';
import IP from './Pages/IPManagement';
import Events from './Pages/Events';
import Login from './Pages/Login';
import Register from './Pages/Register';
import ResetPassword from './Pages/ResetPassword';
import VerifyEmail from './Pages/VerifyEmail';
import SetPassword from './Pages/SetPassword';
import Unauthorized from './Pages/Unauthorized';
import UserProfile from './Pages/UserProfile';
import PersonalProfile from './Pages/PersonalProfile';
import MySubmissions from './Pages/MySubmissions';
import NotFoundPage from './Pages/NotFoundPage';
import Contact from './Pages/Contact';
import Departments from './Pages/Departments';

//Workspace Imports
import DIIWorkspace from './Pages/dashboards/DIIWorkspace';
import DEBMWorkspace from './Pages/dashboards/DEBMWorkspace';
import RTPWorkspace from './Pages/dashboards/RTPWorkspace';
import WorkspacePortal from './Pages/WorkspacePortal';
import MentorWorkspace from './Pages/workspace/MentorWorkspace';
import TechnicalCommitteeWorkspace from './Pages/workspace/TechnicalCommitteeWorkspace';
import CoordinatorWorkspace from './Pages/workspace/CoordinatorWorkspace';

//Dashboard Imports
import AdminDashboard from './Pages/dashboards/AdminDashboard';
import SuperAdminDashboard from './Pages/dashboards/SuperAdminDashboard';
import IPManagerDashboard from './Pages/dashboards/IPManagerDashboard';
import DIIDashboard from './Pages/dashboards/DIIDashboard';
import DEBMDashboard from './Pages/dashboards/DEBMDashboard';
import RTPDashboard from './Pages/dashboards/RTPDashboard';
import MentorDashboard from './Pages/dashboards/MentorDashboard';
import TechnicalCommitteeDashboard from './Pages/dashboards/TechnicalCommitteeDashboard';
import CoordinatorDashboard from './Pages/dashboards/CoordinatorDashboard';

//Admin Pages
import UserManagement from './Pages/admin/UserManagement';
import ProjectApprovals from './Pages/admin/ProjectApprovals';
import AdminAnalytics from './Pages/admin/Analytics';
import FundingManagement from './Pages/admin/FundingManagement';
import AdminSubmissions from './Pages/admin/AdminSubmissions';
import AdminGallery from './Pages/admin/AdminGallery';
import ProjectAssignments from './Pages/admin/ProjectAssignments';
import ContactMessages from './Pages/admin/ContactMessages';
import CmsDashboard from './Pages/admin/cms/CmsDashboard';
import CmsPages from './Pages/admin/cms/CmsPages';
import CmsPosts from './Pages/admin/cms/CmsPosts';
import CmsCategories from './Pages/admin/cms/CmsCategories';

//Gallery Page
import Gallery from './Pages/Gallery';

//SuperAdmin Pages
import RoleManagement from './Pages/superadmin/RoleManagement';
import AuditLogs from './Pages/superadmin/AuditLogs';
import DatabaseInfo from './Pages/superadmin/DatabaseInfo';
import PastUsers from './Pages/superadmin/PastUsers';

//IP Manager Pages
import IPRecords from './Pages/ipmanager/IPRecords';
import PendingApprovals from './Pages/ipmanager/PendingApprovals';
import IPAnalytics from './Pages/ipmanager/Analytics';
import SubmittedIPs from './Pages/ipmanager/SubmittedIPs';
import SubmittedProjects from './Pages/ipmanager/SubmittedProjects';

//Auth Imports
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  ProtectedRoute,
  PublicRoute,
  AdminRoute,
  SuperAdminRoute,
  IPManagerRoute,
  RoleRoute,
} from './components/RoleBasedRoute';

const App = () => (
  <LanguageProvider>
    <ThemeProvider>
    <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Hero />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/departments" element={<RoleRoute roles={['superAdmin','admin','transferTechnologyOfficer','diiDirector','debmDirector','rtpDirector']}><Departments /></RoleRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/gallery" element={<Gallery />} />

              {/* Protected Routes - All authenticated users */}
              <Route path="/set-password" element={<ProtectedRoute><SetPassword /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
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
              <Route path="/admin/assignments" element={<AdminRoute><ProjectAssignments /></AdminRoute>} />
              <Route path="/admin/funding" element={<AdminRoute><FundingManagement /></AdminRoute>} />
              <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
              <Route path="/admin/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
              <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissions /></AdminRoute>} />
              <Route path="/admin/gallery" element={<AdminRoute><AdminGallery /></AdminRoute>} />
              <Route path="/admin/contact" element={<AdminRoute><ContactMessages /></AdminRoute>} />
              <Route path="/admin/cms" element={<AdminRoute><CmsDashboard /></AdminRoute>} />
              <Route path="/admin/cms/pages" element={<AdminRoute><CmsPages /></AdminRoute>} />
              <Route path="/admin/cms/posts" element={<AdminRoute><CmsPosts /></AdminRoute>} />
              <Route path="/admin/cms/categories" element={<AdminRoute><CmsCategories /></AdminRoute>} />

              {/* SuperAdmin Routes */}
              <Route path="/superadmin/dashboard" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
              <Route path="/superadmin/users" element={<SuperAdminRoute><RoleManagement /></SuperAdminRoute>} />
              <Route path="/superadmin/audit-logs" element={<SuperAdminRoute><AuditLogs /></SuperAdminRoute>} />
              <Route path="/superadmin/database" element={<SuperAdminRoute><DatabaseInfo /></SuperAdminRoute>} />
              <Route path="/superadmin/past-users" element={<SuperAdminRoute><PastUsers /></SuperAdminRoute>} />

              {/* IP Manager Routes */}
              <Route path="/ipmanager/dashboard" element={<IPManagerRoute><IPManagerDashboard /></IPManagerRoute>} />
              <Route path="/ipmanager/records" element={<IPManagerRoute><IPRecords /></IPManagerRoute>} />
              <Route path="/ipmanager/pending" element={<IPManagerRoute><PendingApprovals /></IPManagerRoute>} />
              <Route path="/ipmanager/analytics" element={<IPManagerRoute><IPAnalytics /></IPManagerRoute>} />
              <Route path="/ipmanager/submitted-ips" element={<IPManagerRoute><SubmittedIPs /></IPManagerRoute>} />
              <Route path="/ipmanager/submitted-projects" element={<IPManagerRoute><SubmittedProjects /></IPManagerRoute>} />

              {/* DII Director Routes */}
              <Route path="/dii/dashboard" element={<RoleRoute roles={['diiDirector','admin','superAdmin']}><DIIDashboard /></RoleRoute>} />
              <Route path="/dii/workspace" element={<RoleRoute roles={['diiDirector','admin','superAdmin']}><DIIWorkspace /></RoleRoute>} />
              <Route path="/dii/projects" element={<RoleRoute roles={['diiDirector','admin','superAdmin']}><AdminSubmissions /></RoleRoute>} />
              <Route path="/dii/assignments" element={<RoleRoute roles={['diiDirector','admin','superAdmin']}><ProjectAssignments /></RoleRoute>} />

              {/* DEBM Director Routes */}
              <Route path="/debm/dashboard" element={<RoleRoute roles={['debmDirector','admin','superAdmin']}><DEBMDashboard /></RoleRoute>} />
              <Route path="/debm/workspace" element={<RoleRoute roles={['debmDirector','admin','superAdmin']}><DEBMWorkspace /></RoleRoute>} />
              <Route path="/debm/projects" element={<RoleRoute roles={['debmDirector','admin','superAdmin']}><AdminSubmissions /></RoleRoute>} />

              {/* RTP Director Routes */}
              <Route path="/rtp/dashboard" element={<RoleRoute roles={['rtpDirector','admin','superAdmin']}><RTPDashboard /></RoleRoute>} />
              <Route path="/rtp/workspace" element={<RoleRoute roles={['rtpDirector','admin','superAdmin']}><RTPWorkspace /></RoleRoute>} />
              <Route path="/rtp/projects" element={<RoleRoute roles={['rtpDirector','admin','superAdmin']}><AdminSubmissions /></RoleRoute>} />

              {/* Mentor Routes */}
              <Route path="/mentor/dashboard" element={<RoleRoute roles={['mentor','admin','superAdmin']}><MentorDashboard /></RoleRoute>} />
              <Route path="/mentor/projects" element={<RoleRoute roles={['mentor','admin','superAdmin']}><MentorDashboard /></RoleRoute>} />

              {/* Technical Committee Routes */}
              <Route path="/tc/dashboard" element={<RoleRoute roles={['technicalCommittee','admin','superAdmin']}><TechnicalCommitteeDashboard /></RoleRoute>} />
              <Route path="/tc/projects" element={<RoleRoute roles={['technicalCommittee','admin','superAdmin']}><TechnicalCommitteeDashboard /></RoleRoute>} />

              {/* Coordinator Routes */}
              <Route path="/coordinator/dashboard" element={<RoleRoute roles={['coordinator','admin','superAdmin']}><CoordinatorDashboard /></RoleRoute>} />
              <Route path="/coordinator/projects" element={<RoleRoute roles={['coordinator','admin','superAdmin']}><CoordinatorDashboard /></RoleRoute>} />

              {/* Workspace Portal Routes */}
              <Route path="/workspace" element={<ProtectedRoute><WorkspacePortal /></ProtectedRoute>} />
              <Route path="/workspace/mentor" element={<RoleRoute roles={['mentor','admin','superAdmin','transferTechnologyOfficer','diiDirector']}><MentorWorkspace /></RoleRoute>} />
              <Route path="/workspace/technical-committee" element={<RoleRoute roles={['technicalCommittee','admin','superAdmin','transferTechnologyOfficer','diiDirector']}><TechnicalCommitteeWorkspace /></RoleRoute>} />
              <Route path="/workspace/coordinator" element={<RoleRoute roles={['coordinator','admin','superAdmin','transferTechnologyOfficer','diiDirector']}><CoordinatorWorkspace /></RoleRoute>} />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
        </Router>
    </AuthProvider>
    </ThemeProvider>
  </LanguageProvider>
);

export default App;
