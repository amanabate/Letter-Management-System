import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

interface NotificationContextType {
  unreadLetters: number;
  unreadNotifications: number;
  updateUnreadLetters: (count: number) => void;
  updateUnreadNotifications: (count: number) => void;
  refreshCounts: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [unreadLetters, setUnreadLetters] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUnreadCounts = async () => {
    try {
      // Fetch unread letters count
      const lettersRes = await axios.get(
        `http://localhost:5000/api/letters?userEmail=${encodeURIComponent(
          user.email
        )}`
      );
      const unreadLettersCount = lettersRes.data.filter(
        (letter: any) => letter.toEmail === user.email && letter.unread
      ).length;
      setUnreadLetters(unreadLettersCount);

      // Fetch unread notifications count
      const notificationsRes = await axios.get(
        `http://localhost:5000/api/notifications/user/${user._id}`
      );
      const unreadNotificationsCount = notificationsRes.data.filter(
        (notification: any) => !notification.read
      ).length;
      setUnreadNotifications(unreadNotificationsCount);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    // Set up polling every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [user.email, user._id]);

  const updateUnreadLetters = (count: number) => {
    setUnreadLetters(count);
  };

  const updateUnreadNotifications = (count: number) => {
    setUnreadNotifications(count);
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadLetters,
        unreadNotifications,
        updateUnreadLetters,
        updateUnreadNotifications,
        refreshCounts: fetchUnreadCounts,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
