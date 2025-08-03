import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

export interface Attachment {
  filename: string;
  contentType: string;
  uploadDate: string;
}

export interface Letter {
  _id: string;
  subject: string;
  to: string;
  toEmail: string;
  fromEmail: string;
  createdAt: string;
  status: string;
  department: string;
  priority: string;
  attachments: Attachment[];
  content: string;
  fromName: string;
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  archived?: boolean; // Added archived property
}

interface SentContextType {
  letters: Letter[];
  loading: boolean;
  fetchLetters: () => Promise<void>;
  refresh: () => void;
}

const SentContext = createContext<SentContextType | undefined>(undefined);

export const useSent = () => {
  const ctx = useContext(SentContext);
  if (!ctx) throw new Error("useSent must be used within a SentProvider");
  return ctx;
};

export const SentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const fetchLetters = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userEmail = user.email || "";

      if (!userEmail) {
        setLetters([]);
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/letters/sent?userEmail=${encodeURIComponent(
          userEmail
        )}`
      );
      setLetters(response.data);
    } catch (error) {
      console.error("Error fetching sent letters:", error);
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh function to force re-fetch
  const refresh = () => setRefreshFlag((f) => f + 1);

  React.useEffect(() => {
    fetchLetters();
    // eslint-disable-next-line
  }, [refreshFlag]);

  return (
    <SentContext.Provider value={{ letters, loading, fetchLetters, refresh }}>
      {children}
    </SentContext.Provider>
  );
};
