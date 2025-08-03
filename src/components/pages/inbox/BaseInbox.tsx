import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { useNotifications } from "../../../context/NotificationContext";
import TemplateMemoLetter from "../TemplateMemoLetter";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DepartmentSelector from "../DepartmentSelector";
import { useInbox } from "../../../context/InboxContext";
import { useLanguage } from "../LanguageContext";
import LoadingSpinner from "../../common/LoadingSpinner";
import { FaPaperclip } from "react-icons/fa";
import logo from "../../../img icon/logo.png";
import {
  SearchIcon,
  FilterIcon,
  FileTextIcon,
  StarIcon,
  Download,
  Eye,
  Check,
  X,
  Trash2,
} from "lucide-react";

export interface Letter {
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
  status: string;
  rejectionReason?: string;
  attachments?: Array<{ filename: string }>;
  // CC fields
  cc?: string[] | string;
  isCC?: boolean;
  originalLetter?: string;
  assignComment?: string;
  // Assignment fields
  assignerId?: string;
  assignerName?: string;
  assignerDepartment?: string;
}

// Format date function (for modal and lists) - Moved here to be accessible
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

export const getLetterSentDate = (dateString: string) => {
  const d = new Date(dateString);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

// Fetch departments from your actual API
export const fetchDepartments = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/departments");
    return res.data;
  } catch (err) {
    return [];
  }
};

// Fetch users by department from your actual API
export const fetchUsersByDepartment = async (departmentName: string) => {
  try {
    const res = await axios.get(
      `http://localhost:5000/api/users?department=${encodeURIComponent(
        departmentName
      )}`
    );
    return res.data;
  } catch (err) {
    return [];
  }
};

export interface BaseInboxProps {
  user: any;
  letters: Letter[];
  loadingLetters: boolean;
  isRefreshing: boolean;
  totalLetters: number;
  hasInitialLoad: boolean;
  fetchLetters: () => void;
  updateLetterStatus: (letterId: string, updates: any) => void;
  inboxButtons: string[];
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
  currentLetters: Letter[];
  onLetterOpen: (letter: Letter) => void;
  onStarToggle: (letter: Letter, e: React.MouseEvent) => void;
  onRefresh: () => void;
  hasNewLetters: boolean;
  onSearch: (value: string) => void;
  search: string;
}

export const getPriorityBadge = (priority?: string, t?: any) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return (
        <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-600 rounded-full">
          {t?.letterManagement?.priorityValues?.urgent || "Urgent"}
        </span>
      );
    case "high":
      return (
        <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-600 rounded-full">
          {t?.letterManagement?.priorityValues?.high || "High"}
        </span>
      );
    case "normal":
      return (
        <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-600 rounded-full">
          {t?.letterManagement?.priorityValues?.normal || "Normal"}
        </span>
      );
    default:
      return null;
  }
};

export const getFilterCount = (letters: Letter[], filter: string) => {
  switch (filter.toLowerCase()) {
    case "unread":
      return letters.filter((l) => l.unread).length;
    case "starred":
      return letters.filter((l) => l.starred).length;
    case "urgent":
      return letters.filter((l) => l.priority === "urgent").length;
    case "seen":
      return letters.filter((l) => !l.unread).length;
    case "reject":
      return letters.filter((l) => (l as any).status === "rejected").length;
    case "approve":
      return letters.filter((l) => (l as any).status === "pending").length;
    case "assigned":
      return letters.filter((l) => (l as any).status === "assigned").length;
    default:
      return letters.length;
  }
};

export const getButtonColors = (buttonName: string, isActive: boolean) => {
  // Brand colors
  // Primary: #194A8D, Active BG: #367C94, Gold: #D29341, Main text: #00334C
  const colors = {
    all: isActive
      ? "bg-gradient-to-r from-[#194A8D] to-[#367C94] text-white shadow-lg transform scale-105 border-2 border-[#194A8D]"
      : "bg-[#E3F2FD] text-[#194A8D] hover:bg-[#D6E6F7] hover:text-[#194A8D] border border-[#BFD7ED]",
    unread: isActive
      ? "bg-gradient-to-r from-[#194A8D] to-[#367C94] text-white shadow-lg transform scale-105 border-2 border-[#194A8D]"
      : "bg-[#F5F7FA] text-[#194A8D] hover:bg-[#D6E6F7] hover:text-[#194A8D] border border-[#BFD7ED]",
    starred: isActive
      ? "bg-gradient-to-r from-[#D29341] to-[#FFD699] text-white shadow-lg transform scale-105 border-2 border-[#D29341]"
      : "bg-[#FFF8E1] text-[#D29341] hover:bg-[#FFE0B2] hover:text-[#D29341] border border-[#FFD699]",
    urgent: isActive
      ? "bg-gradient-to-r from-[#D29341] to-[#B22222] text-white shadow-lg transform scale-105 border-2 border-[#D29341]"
      : "bg-[#FFF8E1] text-[#B22222] hover:bg-[#FFD699] hover:text-[#B22222] border border-[#FFD699]",
    seen: isActive
      ? "bg-gradient-to-r from-[#194A8D] to-[#367C94] text-white shadow-lg transform scale-105 border-2 border-[#194A8D]"
      : "bg-[#E3F2FD] text-[#367C94] hover:bg-[#D6E6F7] hover:text-[#194A8D] border border-[#BFD7ED]",
    reject: isActive
      ? "bg-gradient-to-r from-[#B22222] to-[#D29341] text-white shadow-lg transform scale-105 border-2 border-[#B22222]"
      : "bg-[#FFE0E0] text-[#B22222] hover:bg-red-600 hover:text-white border border-[#FFD699]",
    approve: isActive
      ? "bg-gradient-to-r from-[#367C94] to-[#194A8D] text-white shadow-lg transform scale-105 border-2 border-[#367C94]"
      : "bg-[#E3F2FD] text-[#367C94] hover:bg-green-600 hover:text-white border border-[#BFD7ED]",
  };
  return colors[buttonName.toLowerCase() as keyof typeof colors] || colors.all;
};

export const getBadgeColors = (buttonName: string, isActive: boolean) => {
  // Brand badge colors
  const colors = {
    all: isActive
      ? "bg-white text-[#194A8D] border border-[#194A8D]"
      : "bg-[#BFD7ED] text-[#194A8D]",
    unread: isActive
      ? "bg-white text-[#194A8D] border border-[#194A8D]"
      : "bg-[#BFD7ED] text-[#194A8D]",
    starred: isActive
      ? "bg-white text-[#D29341] border border-[#D29341]"
      : "bg-[#FFD699] text-[#D29341]",
    urgent: isActive
      ? "bg-white text-[#B22222] border border-[#B22222]"
      : "bg-[#FFD699] text-[#B22222]",
    seen: isActive
      ? "bg-white text-[#367C94] border border-[#367C94]"
      : "bg-[#BFD7ED] text-[#367C94]",
    reject: isActive
      ? "bg-white text-[#B22222] border border-[#B22222]"
      : "bg-[#FFD699] text-[#B22222]",
    approve: isActive
      ? "bg-white text-[#367C94] border border-[#367C94]"
      : "bg-[#BFD7ED] text-[#367C94]",
  };
  return colors[buttonName.toLowerCase() as keyof typeof colors] || colors.all;
};

export const getRecipientDisplayName = (letter: Letter) =>
  letter.toName || (letter.toEmail ? letter.toEmail.split("@")[0] : "");

export const getSenderDisplayName = (letter: Letter) => {
  if (letter.fromName) {
    return letter.fromName;
  }
  if (letter.fromEmail) {
    return letter.fromEmail.split("@")[0];
  }
  return "Unknown Sender";
};

// Debounced search function
export const useDebouncedSearch = (
  callback: (value: string) => void,
  delay = 300
) => {
  const [search, setSearch] = useState("");

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      callback(value);
    }, delay),
    [callback]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  return { search, handleSearchChange };
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
