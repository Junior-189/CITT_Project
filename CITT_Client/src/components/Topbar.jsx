// src/components/Topbar.jsx
import React from "react";
import { FaPhoneAlt, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import { useLanguage } from "../context/LanguageContext";

const Topbar = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="w-full bg-[#0a1f33] text-white text-sm py-2 px-4 md:px-10">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
        {/* Contact Info */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <div className="flex items-center gap-2">
            <FaPhoneAlt className="text-white text-xs" />
            <span>{t('phone')}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-white text-xs" />
            <span>{t('address')}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-white text-xs" />
            <span>{t('email')}</span>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-3 mt-1 md:mt-0">
          <button
            onClick={() => setLanguage("english")}
            className={`transition-colors font-semibold ${
              language === "english"
                ? "text-teal-300 underline"
                : "text-white hover:text-teal-300"
            }`}
          >
            {t('english')}
          </button>
          <span className="text-white">|</span>
          <button
            onClick={() => setLanguage("kiswahili")}
            className={`transition-colors font-semibold ${
              language === "kiswahili"
                ? "text-teal-300 underline"
                : "text-white hover:text-teal-300"
            }`}
          >
            {t('kiswahili')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
