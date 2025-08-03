import React from "react";
import UserInbox from "./UserInbox";
import DirectorOfficeInbox from "./DirectorOfficeInbox";
import SubCategoryDirectorInbox from "./SubCategoryDirectorInbox";
import SubSubCategoryDirectorInbox from "./SubSubCategoryDirectorInbox";
import TopLevelInbox from "./TopLevelInbox";
import LoadingSpinner from "../../common/LoadingSpinner";
import AssignedTasks from '../assign/AssignedTasks';
import { Routes, Route } from 'react-router-dom';
import { useLanguage } from "../LanguageContext";

const InboxRouter: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { t } = useLanguage();
  
  // Define top-level roles
  const topLevelRoles = [
    "director_general",
    "deputy_director_general", 
    "executive_advisor",
  ];

  // Determine which inbox to show based on user role
  const getInboxComponent = () => {
    if (!user.role) {
      return <LoadingSpinner message={t.inbox?.loadingUserInfo || "Loading user information..."} />;
    }

    // Top-level executives
    if (topLevelRoles.includes(user.role)) {
      return <TopLevelInbox />;
    }

    // Director office (manages multiple sub-sub-categories)
    if (user.role === "director_office") {
      return <DirectorOfficeInbox />;
    }

    // Sub-category directors (manages one sub-category)
    if (user.role === "sub_category_director") {
      return <SubCategoryDirectorInbox />;
    }

    // Executive heads (sub-sub-category heads)
    if (user.role === "executive_head") {
      return <SubSubCategoryDirectorInbox />;
    }

    // Regular users
    if (user.role === "user") {
      return <UserInbox />;
    }

    // Fallback for unknown roles
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t.inbox?.accessDenied || "Access Denied"}
          </h2>
          <p className="text-gray-600">
            {t.inbox?.roleNoAccess?.replace("{role}", user.role) || `Your role (${user.role}) doesn't have access to the inbox.`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/" element={getInboxComponent()} />
      <Route path="/assigned-tasks" element={<AssignedTasks />} />
    </Routes>
  );
};

export default InboxRouter; 