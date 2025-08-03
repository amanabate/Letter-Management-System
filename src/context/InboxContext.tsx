import React, { createContext, useContext, useState, ReactNode } from "react";
import axios from "axios";
import { toast } from "react-toastify";

interface Letter {
  _id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  toName?: string;
  department: string;
  priority: string;
  content: string;
  createdAt: string;
  unread: boolean;
  starred: boolean;
  status: string; // <-- Add this line
  attachments?: Array<{ filename: string }>;
  isCC?: boolean;
  originalLetter?: string;
  archived?: boolean; // Added archived property
}

interface InboxContextType {
  letters: Letter[];
  loadingLetters: boolean;
  isRefreshing: boolean;
  totalLetters: number;
  hasInitialLoad: boolean;
  fetchLetters: (isRefresh?: boolean) => Promise<void>;
  updateLetterStatus: (letterId: string, updates: Partial<Letter>) => void;
}

const InboxContext = createContext<InboxContextType | undefined>(undefined);

export const InboxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalLetters, setTotalLetters] = useState(0);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email || "";

  const fetchLetters = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoadingLetters(true);
    }

    try {
      const params: any = {
        userEmail: userEmail,
      };

      const res = await axios.get(`http://localhost:5000/api/letters`, {
        params,
      });

      let fetchedLetters: Letter[];
      let total: number;

      if (Array.isArray(res.data)) {
        fetchedLetters = res.data;
        total = res.data.length;
      } else if (res.data && Array.isArray(res.data.letters)) {
        fetchedLetters = res.data.letters;
        total = res.data.total || res.data.letters.length;
      } else {
        console.error("Invalid response format:", res.data);
        setLetters([]);
        setTotalLetters(0);
        return;
      }

      const formattedLetters = fetchedLetters
        .map((letter: Letter) => ({
          ...letter,
          unread: letter.unread ?? true,
          starred: letter.starred ?? false,
          priority: letter.priority ?? "normal",
          createdAt: letter.createdAt || new Date().toISOString(),
          status: letter.status ?? "sent", // Ensure status is always present
        }))
        .sort(
          (a: Letter, b: Letter) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      if (isRefresh) {
        setLetters((prevLetters) => {
          const existingIds = new Set(prevLetters.map((l) => l._id));
          const newLetters = formattedLetters.filter(
            (l) => !existingIds.has(l._id)
          );
          return [...newLetters, ...prevLetters];
        });
      } else {
        setLetters(formattedLetters);
      }

      setTotalLetters(total);

      if (isRefresh) {
        toast.success("Inbox refreshed successfully!");
      }
    } catch (err) {
      console.error("Error fetching letters:", err);
      if (!isRefresh) {
        setLetters([]);
        setTotalLetters(0);
      }
      toast.error("Error fetching letters. Please try again later.");
    } finally {
      setLoadingLetters(false);
      setIsRefreshing(false);
      if (!hasInitialLoad) {
        setHasInitialLoad(true);
      }
    }
  };

  const updateLetterStatus = async (
    letterId: string,
    updates: Partial<Letter>
  ) => {
    try {
      // Send POST request to backend to update letter status
      await axios.post(`http://localhost:5000/api/letters/status`, {
        letterId,
        ...updates,
      });
      // If successful, update local state
      setLetters((prevLetters) =>
        prevLetters.map((letter) =>
          letter._id === letterId ? { ...letter, ...updates } : letter
        )
      );
    } catch (error) {
      console.error("Failed to update letter status on server:", error);
      toast.error("Failed to update letter status. Please try again.");
    }
  };

  return (
    <InboxContext.Provider
      value={{
        letters,
        loadingLetters,
        isRefreshing,
        totalLetters,
        hasInitialLoad,
        fetchLetters,
        updateLetterStatus,
      }}
    >
      {children}
    </InboxContext.Provider>
  );
};

export const useInbox = () => {
  const context = useContext(InboxContext);
  if (context === undefined) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
};
