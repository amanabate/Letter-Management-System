import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Home, Users, Mail, TrendingUp, TrendingDown } from "lucide-react";
import UserManagement from "./UserManagement";
import LetterManagement from "./LetterManagement";
import { useLanguage } from "./LanguageContext";

const AdminPanel = () => {
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "letters">("users");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const buttonStyle =
    "flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow bg-blue-600 text-white hover:bg-blue-700 transition-all duration-150";

  // Fetch admin statistics
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/dashboard-stats/admin');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

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

        {/* Statistics Cards */}
        {!loading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent Letters</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.sentCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Received Letters</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {stats.receivedCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingDown className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Letters</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(stats.sentCount || 0) + (stats.receivedCount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Mail className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State for Stats */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
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
