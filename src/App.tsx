import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import { InboxProvider, useInbox } from "./context/InboxContext";
import { SentProvider } from "./context/SentContext";
import { LetterFormProvider } from "./context/LetterFormContext";

import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import Home from "./components/pages/Home";
import Dashboard from "./components/pages/Dashboard";
import NewLetter from "./components/pages/NewLetter";
import Inbox from "./components/pages/Inbox";
import Archive from "./components/pages/Archive";
import Notifications from "./components/pages/Notifications";
import Users from "./components/pages/Users";
import Settings from "./components/pages/Settings";
import Signup from "./components/pages/Signup";
import Login from "./components/pages/Login";
import AdminPanel from "./components/pages/AdminPanel";
import AdminCreateUser from "./components/pages/AdminCreateUser";
import Profile from "./components/pages/Profile";
import Sent from "./components/pages/Sent";
import Forget from "./components/pages/Forget";
import ResetPassword from "./components/pages/ResetPassword";
import AssignedTasks from "./components/pages/assign/AssignedTasks";
import CarbonCopyInbox from "./components/pages/inbox/CarbonCopyInbox";
import ForgotPassword from "./components/pages/ForgotPassword";

import { LanguageProvider } from "./components/pages/LanguageContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { motion, AnimatePresence } from "framer-motion"; // Import framer-motion
import axios from "axios";

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.5,
    },
  }),
};

const wordVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const AssignTask = () => {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-main-text">Assign Task</h2>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p>
          This page is for assigning a letter. Please use the Assign Task button
          in your Inbox to assign a letter to someone.
        </p>
      </div>
    </div>
  );
};

export function App() {
  // Initialize from localStorage so state is correct on first render
  const getInitialAuth = () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return {
          isAuthenticated: true,
          isAdmin: parsed.role === "admin",
        };
      } catch {
        return { isAuthenticated: false, isAdmin: false };
      }
    }
    return { isAuthenticated: false, isAdmin: false };
  };

  const initialAuth = getInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    initialAuth.isAuthenticated
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(initialAuth.isAdmin);
  const [appLoading, setAppLoading] = useState<boolean>(
    sessionStorage.getItem("hasLoadedBefore") !== "true"
  );
  const [isOpen, setIsOpen] = useState(true);
  const [assignedTasksCount, setAssignedTasksCount] = useState(0);

  // Helper to sync auth state from localStorage
  const syncAuthState = () => {
    const user = localStorage.getItem("user");
    if (user) {
      setIsAuthenticated(true);
      setIsAdmin(JSON.parse(user).role === "admin");
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Always check auth state on mount
    syncAuthState();
    // Show splash only on first load
    if (sessionStorage.getItem("hasLoadedBefore") !== "true") {
      setAppLoading(true);
      const timer = setTimeout(() => {
        setAppLoading(false);
        sessionStorage.setItem("hasLoadedBefore", "true");
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setAppLoading(false);
    }
  }, []);

  const handleLogin = () => {
    syncAuthState();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    // Navigation will be handled in Header
  };

  const AuthenticatedApp = ({
    children,
    isAdmin,
    onLogout,
  }: {
    children: React.ReactNode;
    isAdmin: boolean;
    onLogout: () => void;
  }) => {
    const { letters } = useInbox();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const newInboxCount = letters.filter((letter) => letter.unread).length;
    const newCCCount = letters.filter(
      (letter) => letter.isCC && letter.unread && letter.toEmail === user.email
    ).length;

    // Fetch assigned tasks count
    useEffect(() => {
      const fetchAssignedTasksCount = async () => {
        try {
          const res = await axios.get(
            `http://localhost:5000/api/letters/assigned?assignedToId=${user.email}`
          );
          setAssignedTasksCount(res.data.length);
        } catch (error) {
          console.error("Failed to fetch assigned tasks count:", error);
          setAssignedTasksCount(0);
        }
      };

      if (user.email && user.role !== "user") {
        fetchAssignedTasksCount();
      }
    }, [user.email, user.role]);

    return (
      <div className="flex w-full min-h-screen bg-gray-50">
        <Sidebar
          isAdmin={isAdmin}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          newInboxCount={newInboxCount}
          hasNewLetters={newInboxCount > 0}
          newCCCount={newCCCount}
          assignedTasksCount={assignedTasksCount}
        />
        <div
          className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "ml-80" : "ml-12"
          } md:ml-0`}
        >
          <Header onLogout={onLogout} />
          <main
            className="p-6 overflow-auto"
            style={{ height: "calc(100vh - 64px)" }}
          >
            {children}
          </main>
        </div>
      </div>
    );
  };

  const PrivateRoute = ({
    children,
    adminRequired = false,
  }: {
    children: React.ReactNode;
    adminRequired?: boolean;
  }) => {
    if (appLoading) {
      return null; // Don't show login or content until loading is done
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    if (adminRequired && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <AuthenticatedApp isAdmin={isAdmin} onLogout={handleLogout}>
        {children}
      </AuthenticatedApp>
    );
  };

  if (appLoading) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-[#FAFBFF] relative overflow-hidden"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(170, 180, 255, 0.5) 1px, transparent 1px)`,
          backgroundSize: `20px 20px`,
        }}
      >
        <motion.div
          key="letterflow-loading"
          initial="hidden"
          animate="visible"
          variants={wordVariants}
          className="relative z-10" // Ensure text is above blobs
        >
          <h1 className="text-6xl font-extrabold text-teal-700">
            {"LetterFlow".split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterVariants}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </h1>
        </motion.div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        <SentProvider>
          <LetterFormProvider>
            <InboxProvider>
              <Router future={{ v7_relativeSplatPath: true }}>
                <>
                  <ToastContainer />
                  <Routes>
                    <Route
                        path="/login"
                        element={<Login onLogin={handleLogin} />}
                      />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route
                        path="/reset-password/:token"
                        element={<ResetPassword />}
                      />
                      <Route
                        path="/"
                        element={<Home onLogin={handleLogin} />}
                      />
                      <Route path="/signup" element={<Signup />} />
                      <Route
                        path="/dashboard"
                        element={
                          <PrivateRoute>
                            <Dashboard />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/new-letter"
                        element={
                          <PrivateRoute>
                            <NewLetter />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/inbox/*"
                        element={
                          <PrivateRoute>
                            <Inbox />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/archive"
                        element={
                          <PrivateRoute>
                            <Archive />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/notifications"
                        element={
                          <PrivateRoute>
                            <Notifications />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/users"
                        element={
                          <PrivateRoute>
                            <Users />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/settings"
                        element={
                          <PrivateRoute>
                            <Settings />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/admin"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AdminPanel />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <PrivateRoute>
                            <Profile />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/sent"
                        element={
                          <PrivateRoute>
                            <Sent />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/assign-task"
                        element={
                          <PrivateRoute>
                            <AssignTask />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/assigned-tasks"
                        element={
                          <PrivateRoute>
                            <AssignedTasks />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/admin/create-user"
                        element={
                          <PrivateRoute adminRequired={true}>
                            <AdminCreateUser />
                          </PrivateRoute>
                        }
                      />
                      <Route
                        path="/carbon-copy"
                        element={
                          <PrivateRoute>
                            <CarbonCopyInbox />
                          </PrivateRoute>
                        }
                      />
                    </Routes>
                  </>
                </Router>
              </InboxProvider>
            </LetterFormProvider>
          </SentProvider>
        </NotificationProvider>
      </ThemeProvider>
  );
}
/*******  0cfabed7-dce5-43a5-8d65-b66ce1d202f6  *******/
