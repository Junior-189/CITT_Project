import { useState } from 'react';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Header from './Header';
import Footer from './Footer';
import CTA from './CTA';
import ProfileForm from '../Pages/ProfileForm';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { showProfileForm } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a1f33]">
      {/* Top Contact Bar */}
      <Topbar />

      {/* University Header with Logo */}
      <Header />

      {/* Layout Container: Sidebar + Content */}
      <div className="flex flex-1">
        {/* Collapsible Sidebar */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Main Content Column */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation Bar with User Menu */}
          <TopNavbar toggleSidebar={toggleSidebar} />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="min-h-full">
              {children}
            </div>
          </main>

          {/* Call to Action Section */}
          <CTA />

          {/* Footer */}
          <Footer />
        </div>
      </div>

      {/* Profile Form Modal (if needed) */}
      {showProfileForm && <ProfileForm />}
    </div>
  );
};

export default MainLayout;
