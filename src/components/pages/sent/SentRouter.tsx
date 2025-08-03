import React from "react";
import UserSent from "./UserSent";
import SubCategoryDirectorSent from "./SubCategoryDirectorSent";
import SubSubCategoryDirectorSent from "./SubSubCategoryDirectorSent";
import DirectorOfficeSent from "./DirectorOfficeSent";
import TopLevelSent from "./TopLevelSent";

const SentRouter: React.FC = () => {
  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || "";
  const userDepartment = user.department || "";

  // Route to appropriate sent component based on user role
  const getSentComponent = () => {
    switch (userRole) {
      case "sub-category-director":
        return <SubCategoryDirectorSent />;
      case "sub-sub-category-director":
        return <SubSubCategoryDirectorSent />;
      case "director-office":
        return <DirectorOfficeSent />;
      case "top-level":
      case "executive-head":
        return <TopLevelSent />;
      default:
        // Regular users and any other roles
        return <UserSent />;
    }
  };

  return getSentComponent();
};

export default SentRouter; 