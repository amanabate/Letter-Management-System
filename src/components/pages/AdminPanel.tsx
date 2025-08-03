import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Home, Users, Mail } from "lucide-react";
import UserManagement from "./UserManagement";
import LetterManagement from "./LetterManagement";
import { useLanguage } from "./LanguageContext";

const AdminPanel = () => {
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "letters">("users");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const buttonStyle =
    "flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
            {t.sidebar.adminPanel || "Admin Panel"}
          </h2>
          <div className="flex gap-3">
            <button
              className={
                buttonStyle +
                " focus:outline-none focus:ring-2 focus:ring-blue-400"
              }
              onClick={() => navigate("/admin/create-user")}
            >
              <UserPlus className="w-5 h-5" />{" "}
              {t.sidebar.users || "Create User"}
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow bg-gray-600 text-white hover:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" /> {t.sidebar.dashboard || "Home"}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg shadow text-base font-medium">
            {successMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-200 rounded-lg p-1 shadow-inner">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                ${
                  activeTab === "users"
                    ? "bg-white shadow text-blue-700"
                    : "text-gray-600 hover:bg-gray-300 hover:text-gray-800"
                }`}
            >
              <Users className="w-5 h-5" /> {t.sidebar.users || "Users"}
            </button>
            <button
              onClick={() => setActiveTab("letters")}
              className={`flex items-center gap-2 px-8 py-3 rounded-md font-semibold text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400
                ${
                  activeTab === "letters"
                    ? "bg-white shadow text-blue-700"
                    : "text-gray-600 hover:bg-gray-300 hover:text-gray-800"
                }`}
            >
              <Mail className="w-5 h-5" /> {t.sidebar.letters || "Letters"}
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-[calc(100vh-280px)] min-h-[600px]">
            {activeTab === "users" ? (
              <UserManagement setSuccessMsg={setSuccessMsg} />
            ) : (
              <LetterManagement setSuccessMsg={setSuccessMsg} isAdmin={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
