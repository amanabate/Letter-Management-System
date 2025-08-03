import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../components/pages/LanguageContext';

export const PublicFooter = (): JSX.Element => {
  const { t, lang } = useLanguage();
  console.log("Current lang:", lang, "Footer object:", t.footer);
  return (
    <footer key={lang} className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t.footer?.about || "About"}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/about" className="hover:text-blue-700">{t.footer?.instituteOverview || "Institute Overview"}</Link>
              </li>
              <li>
                <Link to="/mission" className="hover:text-blue-700">{t.footer?.missionVision || "Mission & Vision"}</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-700">{t.footer?.contactUs || "Contact Us"}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t.footer?.resources || "Resources"}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/services" className="hover:text-blue-700">{t.footer?.ourServices || "Our Services"}</Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-blue-700">{t.footer?.documentation || "Documentation"}</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-700">{t.footer?.faqs || "FAQs"}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t.footer?.legal || "Legal"}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/privacy" className="hover:text-blue-700">{t.footer?.privacyPolicy || "Privacy Policy"}</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-700">{t.footer?.termsOfUse || "Terms of Use"}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              {t.footer?.location || "Location"}
            </h3>
            <p className="mt-4 text-sm text-gray-500">
              {t.footer?.instituteName || "Space Science and Geospatial Institute (SSGI)"}<br />
        
        
              {t.footer?.address || "Menelik II Avenue, Addis Ababa (4 Kilo area)"}<br />
              <a href="https://ssgi.gov.et" className="text-blue-600 hover:text-blue-800">
                {t.footer?.website || "Visit our website"}
              </a>
            </p>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {t.footer?.copyright || "All rights reserved."}
        </div>
      </div>
    </footer>
  );
};
