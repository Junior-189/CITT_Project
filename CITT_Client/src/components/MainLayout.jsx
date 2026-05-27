import { useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { showProfileForm } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a1f33]">
      <Topbar />
      <Header />
      <div className="flex flex-1 overflow-hidden bg-white">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar />
          <main className="flex-1 overflow-y-auto">
            <div className="min-h-full">{children}</div>
          </main>
          {isHomePage && <><CTA /><Footer /></>}
        </div>
      </div>
      {showProfileForm && <ProfileForm />}
    </div>
  );
};

export default MainLayout;
