import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Header from './Header';
import Footer from './Footer';
import CTA from './CTA';
import ProfileForm from '../Pages/ProfileForm';
import { useAuth } from '../context/AuthContext';

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const { showProfileForm } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile only — avoids content being hidden)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleSidebarToggle = () => setSidebarOpen(prev => !prev);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a1f33]">
      <Topbar />
      <Header />
      <div className="flex flex-1 overflow-hidden bg-white relative">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar sidebarOpen={sidebarOpen} onToggleSidebar={handleSidebarToggle} />
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full">{children}</div>
            {isHomePage && <><CTA /><Footer /></>}
          </main>
        </div>
      </div>
      {showProfileForm && <ProfileForm />}
    </div>
  );
};

export default MainLayout;
