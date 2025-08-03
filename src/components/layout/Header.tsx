import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchIcon,
  BellIcon,
  UserIcon,
  LogOutIcon,
  SettingsIcon,
  XIcon,
  GlobeIcon,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import {
  useLanguage,
  SupportedLang,
} from "../../components/pages/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import logo from "../../img icon/logo.png";

interface HeaderProps {
  onLogout: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { unreadNotifications } = useNotifications();
  const { lang, setLang, t } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
  }, []);

  // Listen for changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for custom events when user data is updated
    window.addEventListener("userDataUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userDataUpdated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setOpen(false);
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    setOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout();
    navigate("/");
  };

  const handleLanguageSwitch = () => {
    setLang(lang === SupportedLang.Am ? SupportedLang.En : SupportedLang.Am);
  };

  return (
    <header
      className={`h-16 border-b flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#2E5C7D] border-[#C88B3D]/20 text-white"
          : "bg-white border-gray-100 text-gray-900"
      }`}
    >
      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={logo} alt="SSGI Logo" className="h-10" />
      </div>

      {/* Right: Notification + Profile */}
      <div className="flex items-center space-x-4">
        {/* Language Switcher Button */}
        <button
          onClick={handleLanguageSwitch}
          className={`p-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2 ${
            theme === "dark"
              ? "text-white/80 hover:text-white hover:bg-[#C88B3D]/20"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <GlobeIcon className="w-5 h-5" />
          <span>
            {lang === SupportedLang.Am ? "eng" : "am"}
          </span>
        </button>

        <button
          onClick={() => navigate("/notifications")}
          className={`relative p-2 rounded-lg transition-colors ${
            theme === "dark"
              ? "text-white/80 hover:text-white hover:bg-[#C88B3D]/20"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <BellIcon className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] text-white text-xs font-medium flex items-center justify-center rounded-full border-2 ${
                theme === "dark"
                  ? "bg-[#D62E2E] border-[#2E5C7D]"
                  : "bg-red-500 border-white"
              }`}
            >
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </span>
          )}
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`flex items-center space-x-3 rounded-lg p-2 transition-colors ${
              theme === "dark" ? "hover:bg-[#C88B3D]/20" : "hover:bg-gray-50"
            }`}
          >
            <img
              src={
                user?.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || t.header.profile
                )}&background=E3F2FD&color=2563EB`
              }
              alt="User Avatar"
              className={`w-8 h-8 rounded-full object-cover border ${
                theme === "dark" ? "border-[#C88B3D]/30" : "border-gray-200"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                theme === "dark" ? "text-white" : "text-gray-700"
              }`}
            >
              {user?.name || t.header.profile}
            </span>
          </button>

          {/* Dropdown Menu */}
          <div
            ref={dropdownRef}
            className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg border transition-all duration-200 z-[1001] ${
              theme === "dark"
                ? "bg-[#2E5C7D] border-[#C88B3D]/30"
                : "bg-white border-gray-100"
            } ${
              open
                ? "opacity-100 translate-y-0 visible"
                : "opacity-0 -translate-y-2 invisible"
            }`}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={handleProfileClick}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  theme === "dark"
                    ? "text-white/80 hover:text-white hover:bg-[#C88B3D]/20"
                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>{t.header.profile}</span>
              </button>
              <button
                onClick={handleSettingsClick}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  theme === "dark"
                    ? "text-white/80 hover:text-white hover:bg-[#C88B3D]/20"
                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>{t.header.settings}</span>
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  theme === "dark"
                    ? "text-white/80 hover:text-white hover:bg-[#D62E2E]/20"
                    : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <LogOutIcon className="w-4 h-4" />
                <span>{t.header.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
