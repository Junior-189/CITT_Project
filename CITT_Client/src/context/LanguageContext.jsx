import React, { createContext, useState, useEffect } from 'react';

// Create the language context
export const LanguageContext = createContext();

// Translations object
export const translations = {
  english: {
    // Topbar
    phone: '+255 25 295 7544',
    address: 'P.O.Box 131, Mbeya - Tanzania',
    email: 'must@must.ac.tz',
    english: 'English',
    kiswahili: 'Kiswahili',

    // Navbar
    home: 'Home',
    about: 'About',
    projects: 'Projects',
    funding: 'Funding',
    ipManagement: 'IP Management',
    events: 'Events',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',

    // Hero
    heroTitle: 'Welcome to CITT',
    heroSubtitle: 'Center for Innovation and Technology Transfer',
    heroDescription: 'Bridging the gap between research and industry',
    getStarted: 'Get Started',
    learnMore: 'Learn More',

    // About
    aboutTitle: 'About CITT',
    aboutDescription: 'The Center for Innovation and Technology Transfer is dedicated to fostering innovation and entrepreneurship.',

    // Auth
    loginTitle: 'Login to CITT',
    registerTitle: 'Create Account',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Full Name',
    phone: 'Phone Number',
    university: 'University',
    college: 'College/Faculty',
    yearOfStudy: 'Year of Study',
    role: 'Role',
    submit: 'Submit',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    clickHere: 'Click here',

    // Pages
    projectsPage: 'Projects',
    fundingPage: 'Funding',
    eventsPage: 'Events',
    ipPage: 'IP Management',

    // Forms
    fullName: 'Full Name',
    completeProfile: 'Complete Your Profile',
    saveProfile: 'Save Profile',
  },
  kiswahili: {
    // Topbar
    phone: '+255 25 295 7544',
    address: 'S.L.P 131, Mbeya - Tanzania',
    email: 'must@must.ac.tz',
    english: 'English',
    kiswahili: 'Kiswahili',

    // Navbar
    home: 'Nyumbani',
    about: 'Kuhusu',
    projects: 'Miradi',
    funding: 'Fedha',
    ipManagement: 'Usimamizi wa Haki za Akili',
    events: 'Matukio',
    login: 'Ingia',
    register: 'Jiandikishe',
    logout: 'Toka',

    // Hero
    heroTitle: 'Karibu kwenye CITT',
    heroSubtitle: 'Kituo cha Uvumbuzi na Uhamaji wa Teknolohia',
    heroDescription: 'Kuunganisha kile kinachojulikana na sekta za biashara',
    getStarted: 'Anza Sasa',
    learnMore: 'Jifunze Zaidi',

    // About
    aboutTitle: 'Kuhusu CITT',
    aboutDescription: 'Kituo cha Uvumbuzi na Uhamaji wa Teknolohia kinajitolea kusambaza uvumbuzi na ujasiriamali.',

    // Auth
    loginTitle: 'Ingia kwenye CITT',
    registerTitle: 'Tengeneza Akaunti',
    email: 'Barua Pepe',
    password: 'Neno Siri',
    confirmPassword: 'Thibitisha Neno Siri',
    name: 'Jina Kamili',
    phone: 'Namba ya Simu',
    university: 'Chuo Kikuu',
    college: 'Kollehimath/Fakiliti',
    yearOfStudy: 'Mwaka wa Masomo',
    role: 'Jukumu',
    submit: 'Wasilisha',
    alreadyHaveAccount: 'Una akaunti tayari?',
    dontHaveAccount: 'Huna akaunti?',
    clickHere: 'Bofya hapa',

    // Pages
    projectsPage: 'Miradi',
    fundingPage: 'Fedha',
    eventsPage: 'Matukio',
    ipPage: 'Usimamizi wa Haki za Akili',

    // Forms
    fullName: 'Jina Kamili',
    completeProfile: 'Kamilisha Wasifu Wako',
    saveProfile: 'Hifadhi Wasifu',
  },
};

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage on mount, default to 'english'
    return localStorage.getItem('language') || 'english';
  });

  // Persist language choice to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'english' ? 'kiswahili' : 'english'));
  };

  const t = (key) => {
    return translations[language][key] || translations['english'][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
