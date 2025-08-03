import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Inbox, Bell, FileText, Users, Settings } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import Badge from "../common/Badge";

const Navigation = () => {
  const location = useLocation();
  const { unreadLetters, unreadNotifications } = useNotifications();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: "/inbox",
      icon: Inbox,
      label: "Inbox",
      badge: unreadLetters,
    },
    {
      path: "/notifications",
      icon: Bell,
      label: "Notifications",
      badge: unreadNotifications,
    },
    {
      path: "/new-letter",
      icon: FileText,
      label: "New Letter",
    },
    {
      path: "/users",
      icon: Users,
      label: "Users",
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md">Letter Management</h1>
      </div>
      <div className="mt-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 relative ${
              isActive(item.path) ? "bg-blue-50 text-blue-600" : ""
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="ml-3">{item.label}</span>
            {item.badge !== undefined && <Badge count={item.badge} />}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
