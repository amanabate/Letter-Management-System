import React, { useEffect, useState } from "react";
import { StatsBarChart } from "../dashboard/StatsBarChart";
import { StatsPieChart } from "../dashboard/StatsPieChart";
import { StatsLineChart } from "../dashboard/StatsLineChart";
import LoadingSpinner from "../common/LoadingSpinner";
import { useLanguage } from "./LanguageContext";

const CACHE_KEY = "dashboardStats";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email;

  // Helper to get cached data
  const getCachedStats = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return data;
      }
    } catch {
      // ignore parse errors
    }
    return null;
  };

  const fetchStats = (force = false) => {
    if (!force) {
      const cached = getCachedStats();
      if (cached) {
        setStats(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    fetch(`http://localhost:5000/api/dashboard-stats?userEmail=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      })
      .catch((err) => {
        setError("Failed to load dashboard stats");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    localStorage.removeItem(CACHE_KEY);
    fetch(`http://localhost:5000/api/dashboard-stats?userEmail=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setRefreshing(false);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      })
      .catch((err) => {
        setError("Failed to load dashboard stats");
        setRefreshing(false);
      });
  };

  if (loading) return <LoadingSpinner message="Loading dashboard stats..." />;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!stats) return null;

  // User-specific stats
  const userStats = stats.userStats || {};
  const barData = (userStats.userLetterStatusCounts || []).map((s: any) => ({
    name: s._id,
    value: s.count,
  }));
  const lineData = (userStats.userLettersByDate || []).map((d: any) => ({
    date: d._id,
    value: d.count,
  }));

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md">
            {t.dashboard.dashboard || "Dashboard"}
          </h2>
          <p className="text-lg text-[#BFBFBF] font-medium">
            {t.dashboard.analyticsWelcome || "Welcome to your analytics dashboard"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {refreshing ? (t.dashboard.refreshing || "Refreshing...") : (t.dashboard.refreshStats || "Refresh Stats")}
        </button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <span className="text-3xl font-bold text-[#10b981]">
              {userStats.sentCount ?? 0}
            </span>
            <span className="text-gray-500 mt-2">{t.dashboard.sentLetters || "Sent Letters"}</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <span className="text-3xl font-bold text-[#6366f1]">
              {userStats.receivedCount ?? 0}
            </span>
            <span className="text-gray-500 mt-2">{t.dashboard.receivedLetters || "Received Letters"}</span>
          </div>
          <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <span className="text-3xl font-bold text-[#f59e42]">
              {userStats.totalUserLetters ?? 0}
            </span>
            <span className="text-gray-500 mt-2">{t.dashboard.totalUserLetters || "Total (Sent + Received)"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <StatsBarChart data={barData} />
          </div>
          <div className="transition-transform duration-200 hover:scale-105 hover:shadow-2xl cursor-pointer">
            <StatsLineChart data={lineData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
