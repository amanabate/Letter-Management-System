import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  MailPlusIcon,
  InboxIcon,
  ArchiveIcon,
  BellIcon,
  UsersIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
  ShieldIcon,
  ChevronsLeft,
  ChevronsRight,
  SendIcon,
  ClipboardListIcon,
} from "lucide-react";
import { MdContentCopy } from "react-icons/md";
import { useLanguage } from "../../components/pages/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { icon: LayoutDashboardIcon, labelKey: "dashboard", path: "/dashboard" },
  { icon: MailPlusIcon, labelKey: "newLetter", path: "/new-letter" },
  { icon: InboxIcon, labelKey: "inbox", path: "/inbox" },
  { icon: MdContentCopy, labelKey: "carbonCopy", path: "/carbon-copy" }, // Carbon Copy button with new icon
  { icon: SendIcon, labelKey: "sent", path: "/sent" },
  { icon: ArchiveIcon, labelKey: "archive", path: "/archive" }, // Added Archive section
  { icon: BellIcon, labelKey: "notifications", path: "/notifications" },
  { icon: SettingsIcon, labelKey: "settings", path: "/settings" },
];

const adminItems = [
  { icon: ShieldIcon, labelKey: "adminPanel", path: "/admin" },
  { icon: UsersIcon, labelKey: "assignTask", path: "/assign-task" }, // Added Assign Task for admins only
];

export const Sidebar = ({
  isAdmin = false,
  isOpen,
  setIsOpen,
  hasNewLetters = false,
  newInboxCount = 0,
  newCCCount = 0,
  assignedTasksCount = 0,
}: {
  isAdmin?: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasNewLetters?: boolean;
  newInboxCount?: number;
  newCCCount?: number;
  assignedTasksCount?: number;
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isRegularUser = user.role === "user";
  const isAdminUser = user.role === "admin";

  let items = [...navItems];

  // Show Task Assigned for all users who are not regular users
  if (!isRegularUser) {
    // Insert Task Assigned after Inbox
    const inboxIndex = items.findIndex((item) => item.labelKey === "inbox");
    if (inboxIndex !== -1) {
      items.splice(inboxIndex + 1, 0, {
        icon: ClipboardListIcon,
        labelKey: "taskAssigned",
        path: "/assigned-tasks",
      });
    }
  }

  if (isAdmin) {
    items = items.concat(
      adminItems.filter((item) => item.labelKey !== "assignTask")
    );
  }

  return (
    <>
      {/* Fixed Top Toggle Button for Mobile */}
      <div
        className={`fixed top-0 left-0 w-full border-b md:hidden z-50 flex items-center justify-between p-4 transition-colors duration-300 ${
          theme === "dark"
            ? "bg-[#2E5C7D] border-[#C88B3D]/20 text-white"
            : "bg-white border-gray-200 text-gray-900"
        }`}
      >
        <h1
          className={`text-xl font-semibold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-main-text"
          }`}
        >
          {t.sidebar.letterFlow}
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-main-text"
          }`}
        >
          {isOpen ? (
            <XIcon className="w-6 h-6" />
          ) : (
            <MenuIcon className="w-6 h-6" />
          )}
        </button>
      </div>

             {/* Sidebar */}
       <div
         className={`fixed z-40 transform transition-all duration-300 ease-in-out
       top-16 h-[calc(100vh-64px)] /* Mobile: always positioned below header and takes remaining height */
       ${
         isOpen ? "translate-x-0 w-96" : "translate-x-0 w-12"
       } /* Mobile width: open 96, closed 12 */
       md:translate-x-0 md:static md:block md:h-screen /* Desktop: always visible, static, full height */
       ${isOpen ? "md:w-80" : "md:w-20"} /* Desktop width: open 80, closed 20 */
       ${theme === "dark" ? "bg-[#2E5C7D]" : "bg-white"}`}
       >
        <div
          className={`h-full border-r-2 rounded-tr-[32px] rounded-br-[32px] relative transition-colors duration-300 ${
            theme === "dark" ? "border-[#C88B3D]/30" : "border-gray-300"
          }`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`absolute -right-3 top-8 rounded-full p-1.5 border-2 cursor-pointer transition-colors duration-300 ${
              theme === "dark"
                ? "bg-[#2E5C7D] border-[#C88B3D] hover:bg-[#C88B3D]/20"
                : "bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {isOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
          </button>

          {/* Logo Section */}
          <div className="px-5 py-4">
            <h1
              className={`text-2xl font-bold transition-all duration-300 ${
                !isOpen && "scale-0"
              } ${theme === "dark" ? "text-white" : "text-main-text"}`}
            >
              {t.sidebar.letterFlow}
            </h1>
          </div>

          {/* Navigation Container with Scrollbar */}
          <div className="flex flex-col h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
            {/* Navigation Items */}
            <nav
              className={`px-2 py-6 flex flex-col ${
                isOpen ? "space-y-3" : "space-y-1"
              }`}
            >
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => {
                    const isAssignTask = item.labelKey === "assignTask";
                    const isTaskAssigned = item.labelKey === "taskAssigned";
                    const iconColorClasses = isAssignTask
                      ? "text-red-600"
                      : isTaskAssigned
                      ? "text-blue-600"
                      : isActive
                      ? "text-hover-gold"
                      : "text-main-text group-hover:text-hover-gold";

                    return `flex items-center rounded-md text-[16px] transition-all group
                    ${
                      isOpen
                        ? "w-full gap-8 px-4 py-2.5"
                        : "justify-center py-2.5"
                    }
                    ${
                      isActive
                        ? theme === "dark"
                          ? "bg-[#C88B3D]/20 font-medium text-[#C88B3D]"
                          : "bg-active-bg-dark font-medium text-hover-gold"
                        : theme === "dark"
                        ? "text-white/80 hover:bg-[#C88B3D]/10 hover:text-[#C88B3D]"
                        : "text-main-text hover:bg-gray-50 hover:text-hover-gold"
                    } transition-transform duration-200 hover:scale-[1.04]`;
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative flex items-center">
                        <item.icon
                          className={`w-[22px] h-[22px] flex-shrink-0 transition-colors duration-300 ${
                            isActive
                              ? theme === "dark"
                                ? "text-[#C88B3D]"
                                : "text-hover-gold"
                              : theme === "dark"
                              ? "text-white/80 group-hover:text-[#C88B3D]"
                              : "text-main-text group-hover:text-hover-gold"
                          }`}
                        />
                        {/* Show badge if Inbox and newInboxCount > 0 */}
                        {item.labelKey === "inbox" && newInboxCount > 0 && (
                          <span
                            className={`absolute -top-2 -right-2 min-w-[18px] h-5 px-1 text-white text-xs font-bold rounded-full border-2 flex items-center justify-center animate-bounce ${
                              theme === "dark"
                                ? "bg-[#D62E2E] border-[#2E5C7D]"
                                : "bg-red-500 border-white"
                            }`}
                          >
                            {newInboxCount > 9 ? "9+" : newInboxCount}
                          </span>
                        )}
                        {/* Show badge if Carbon Copy and newCCCount > 0 */}
                        {item.labelKey === "carbonCopy" && newCCCount > 0 && (
                          <span
                            className={`absolute -top-2 -right-2 min-w-[18px] h-5 px-1 text-white text-xs font-bold rounded-full border-2 flex items-center justify-center animate-bounce ${
                              theme === "dark"
                                ? "bg-[#D62E2E] border-[#2E5C7D]"
                                : "bg-red-500 border-white"
                            }`}
                          >
                            {newCCCount > 9 ? "9+" : newCCCount}
                          </span>
                        )}
                        {/* Show badge if Task Assigned and assignedTasksCount > 0 */}
                        {item.labelKey === "taskAssigned" &&
                          assignedTasksCount > 0 && (
                            <span
                              className={`absolute -top-2 -right-2 min-w-[18px] h-5 px-1 text-white text-xs font-bold rounded-full border-2 flex items-center justify-center animate-bounce ${
                                theme === "dark"
                                  ? "bg-[#D62E2E] border-[#2E5C7D]"
                                  : "bg-red-500 border-white"
                              }`}
                            >
                              {assignedTasksCount > 9
                                ? "9+"
                                : assignedTasksCount}
                            </span>
                          )}
                      </div>
                      {/* Only show label if not 'assignTask' or 'taskAssigned' */}
                      {isOpen && (
                        <span className="flex-grow truncate">
                          {t.sidebar[item.labelKey as keyof typeof t.sidebar] ||
                            (item.labelKey === "assignTask"
                              ? "Assign Task"
                              : item.labelKey === "taskAssigned"
                              ? "Task Assigned"
                              : "")}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            
                         {/* Feedback Section - Only show when sidebar is open */}
             {isOpen && (
               <div className="px-6 py-8 mt-12 border-t border-gray-200 dark:border-gray-600">
                                   {/* Card Icons with Swirling Pattern */}
                  <div className="relative mb-12">
                    {/* Swirling dashed line */}
                    <svg
                      className="absolute inset-0 w-full h-24"
                      viewBox="0 0 200 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 25 Q50 5 80 25 T140 25 Q170 70 180 25"
                        stroke={theme === "dark" ? "#9CA3AF" : "#D1D5DB"}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        fill="none"
                      />
                      {/* Dots along the path */}
                      <circle cx="20" cy="25" r="2" fill={theme === "dark" ? "#9CA3AF" : "#9CA3AF"} />
                      <circle cx="80" cy="25" r="2" fill={theme === "dark" ? "#9CA3AF" : "#9CA3AF"} />
                      <circle cx="140" cy="25" r="2" fill={theme === "dark" ? "#9CA3AF" : "#9CA3AF"} />
                      <circle cx="180" cy="25" r="2" fill={theme === "dark" ? "#9CA3AF" : "#9CA3AF"} />
                    </svg>
                    
                    {/* Card 1 - Top left (largest) */}
                    <div className={`absolute top-0 left-0 w-12 h-8 rounded-lg shadow-sm border flex items-start justify-start p-1 ${
                      theme === "dark" 
                        ? "bg-[#2E5C7D] border-[#C88B3D]/30" 
                        : "bg-white border-gray-200"
                    }`}>
                      <div className={`w-2 h-2 rounded-sm mr-1 mt-1 ${
                        theme === "dark" ? "bg-[#C88B3D]" : "bg-hover-gold"
                      }`}></div>
                      <div className="flex flex-col space-y-0.5 flex-1">
                        <div className={`h-1 rounded w-3/4 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-1/2 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-2/3 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-1/3 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                      </div>
                    </div>
                    
                    {/* Card 2 - Bottom middle (smallest) */}
                    <div className={`absolute bottom-0 left-8 w-8 h-6 rounded-lg shadow-sm border flex items-center justify-center ${
                      theme === "dark" 
                        ? "bg-[#2E5C7D] border-[#C88B3D]/30" 
                        : "bg-white border-gray-200"
                    }`}>
                      <div className={`w-2 h-2 rounded-sm mr-1 ${
                        theme === "dark" ? "bg-[#C88B3D]" : "bg-hover-gold"
                      }`}></div>
                      <div className="flex flex-col space-y-0.5">
                        <div className={`h-1 rounded w-6 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-4 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                      </div>
                    </div>
                    
                    {/* Card 3 - Top right (medium) */}
                    <div className={`absolute top-0 right-0 w-12 h-8 rounded-lg shadow-sm border flex items-start justify-start p-1 ${
                      theme === "dark" 
                        ? "bg-[#2E5C7D] border-[#C88B3D]/30" 
                        : "bg-white border-gray-200"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 mt-1 ${
                        theme === "dark" ? "bg-[#C88B3D]" : "bg-hover-gold"
                      }`}></div>
                      <div className="flex flex-col space-y-0.5 flex-1">
                        <div className={`h-1 rounded w-3/4 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-1/2 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-2/3 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                        <div className={`h-1 rounded w-1/3 ${
                          theme === "dark" ? "bg-gray-400" : "bg-gray-300"
                        }`}></div>
                      </div>
                    </div>
                  </div>
                 
                 {/* Greeting Text */}
                 <div className="text-center mb-10">
                   <h3 className={`text-xl font-bold mb-4 ${
                     theme === "dark" ? "text-white" : "text-gray-900"
                   }`}>
                     Hi, {user.name || "user name"}
                   </h3>
                   <p className={`text-sm ${
                     theme === "dark" ? "text-gray-300" : "text-gray-600"
                   }`}>
                     Spot any bugs or have feedback?
                   </p>
                 </div>
                 
                                   {/* Contact Button */}
                  <button
                    className={`w-full font-bold py-3 px-4 rounded-lg shadow-sm transition-colors duration-200 ${
                      theme === "dark" 
                        ? "bg-[#2E5C7D] hover:bg-[#1E4C6D] hover:text-hover-gold text-white" 
                        : "bg-[#2E5C7D] hover:bg-[#1E4C6D] hover:text-hover-gold text-white"
                    }`}
                    onClick={() => {
                      // Open Telegram contact
                      window.open('https://t.me/GodisGoodallzT', '_blank');
                    }}
                  >
                    Contact Developer
                  </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-30"
        />
      )}
    </>
  );
};
