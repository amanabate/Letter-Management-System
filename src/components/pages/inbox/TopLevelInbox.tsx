import React, { useState, useEffect, useMemo } from "react";
import { useInbox } from "../../../context/InboxContext";
import { useLanguage } from "../LanguageContext";
import { useNotifications } from "../../../context/NotificationContext";
import LoadingSpinner from "../../common/LoadingSpinner";
import { FileTextIcon } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  getFilterCount,
  getButtonColors,
  getBadgeColors,
  useDebouncedSearch,
} from "./BaseInbox";
import LetterListItem from "../assign/LetterListItem";
import { Letter } from "./BaseInbox";
import TemplateMemoLetter from "../TemplateMemoLetter";
import DepartmentSelector from "../DepartmentSelector";
import logo from "../../../img icon/logo.png";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import { FaPaperclip } from "react-icons/fa";
import { Download } from "lucide-react";
import { FaThList, FaThLarge } from "react-icons/fa";
import CardLetterItem from "../assign/CardLetterItem";

const TopLevelInbox: React.FC = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { t } = useLanguage();
  const { updateUnreadLetters } = useNotifications();
  const {
    letters,
    loadingLetters,
    isRefreshing,
    totalLetters,
    hasInitialLoad,
    fetchLetters,
    updateLetterStatus,
  } = useInbox();

  // State (mirroring SubCategoryDirectorInbox)
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [openLetter, setOpenLetter] = useState<Letter | null>(null);
  const [viewMode, setViewMode] = useState(false); // false = detail, true = memo
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState<string>(
    new Date().toISOString()
  );
  const [hasNewLetters, setHasNewLetters] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingActionLetter, setPendingActionLetter] = useState<Letter | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [forwardStatus, setForwardStatus] = useState<string | null>(null);
  const [forwardComment, setForwardComment] = useState("");
  const [forwardIncludeSender, setForwardIncludeSender] = useState(false);
  const [isForwardLoading, setIsForwardLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewType, setPreviewType] = useState<string>("");
  const [isDownloadLoading, setIsDownloadLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [isViewFileLoading, setIsViewFileLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [viewType, setViewType] = useState<"list" | "card">(
    localStorage.getItem("inboxViewType") === "card" ? "card" : "list"
  );
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingApproveLetter, setPendingApproveLetter] =
    useState<Letter | null>(null);

  // Buttons
  const inboxButtons = [
    { key: "all", label: t.inbox?.filterAll || "All" },
    { key: "unread", label: t.inbox?.filterUnread || "Unread" },
    { key: "starred", label: t.inbox?.filterStarred || "Starred" },
    { key: "urgent", label: t.inbox?.filterUrgent || "Urgent" },
    { key: "seen", label: t.inbox?.filterSeen || "Seen" },
    { key: "assigned", label: t.inbox?.filterAssigned || "Assigned" },
  ];

  // Debounced search
  const { search, handleSearchChange } = useDebouncedSearch((value: string) => {
    // Handle search logic here
  });

  // Filter out CC and archived letters only (assigned letters should appear in inbox)
  const visibleLetters = letters.filter(
    (letter) => !letter.isCC && !letter.archived
  );

  // Filter letters based on selected filter
  const filteredLetters = useMemo(() => {
    let filtered = visibleLetters;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (letter) =>
          letter.subject.toLowerCase().includes(search.toLowerCase()) ||
          letter.fromName.toLowerCase().includes(search.toLowerCase()) ||
          letter.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case "unread":
        filtered = filtered.filter((letter) => letter.unread);
        break;
      case "starred":
        filtered = filtered.filter((letter) => letter.starred);
        break;
      case "urgent":
        filtered = filtered.filter((letter) => letter.priority === "urgent");
        break;
      case "seen":
        filtered = filtered.filter((letter) => !letter.unread);
        break;
      case "approve":
        filtered = filtered.filter((letter) => letter.status === "pending");
        break;
      case "reject":
        filtered = filtered.filter((letter) => letter.status === "rejected");
        break;
      case "assigned":
        filtered = filtered.filter((letter) => letter.status === "assigned");
        break;
      default:
        break;
    }

    return filtered;
  }, [visibleLetters, selectedFilter, search]);

  // Pagination
  const currentLetters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLetters.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLetters, currentPage]);

  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);

  // Initial fetch
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchLetters();
    }
  }, [hasInitialLoad, fetchLetters]);

  // Check for new letters
  useEffect(() => {
    const checkForNewLetters = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/letters/check-new?lastChecked=${lastCheckedTimestamp}&userEmail=${user.email}`
        );
        const data = await response.json();
        if (data.hasNew) {
          setHasNewLetters(true);
        }
      } catch (error) {
        console.error("Error checking for new letters:", error);
      }
    };

    const interval = setInterval(checkForNewLetters, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [lastCheckedTimestamp, user.email]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/departments")
      .then((res) => setDepartments(res.data))
      .catch(() => setDepartments([]));
  }, []);
  useEffect(() => {
    if (selectedDepartment) {
      axios
        .get(
          `http://localhost:5000/api/users?department=${encodeURIComponent(
            selectedDepartment
          )}`
        )
        .then((res) => setDepartmentUsers(res.data))
        .catch(() => setDepartmentUsers([]));
    } else {
      setDepartmentUsers([]);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    // Fetch all users for recipient name mapping
    const fetchAllUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        setAllUsers(res.data);
      } catch (e) {
        setAllUsers([]);
      }
    };
    fetchAllUsers();
  }, []);

  function getRecipientProfileName(letter: any) {
    if (!letter) return "";
    // Try to match by email first
    const user = allUsers.find(
      (u) => u.email === letter.toEmail || u.name === letter.toName
    );
    return (
      user?.name ||
      letter.toName ||
      (letter.toEmail ? letter.toEmail.split("@")[0] : "")
    );
  }

  // Handle letter open
  const handleLetterOpen = (letter: Letter) => {
    setOpenLetter(letter);
    setShowModal(true);
    setViewMode(false);

    // Mark as read if unread
    if (letter.unread) {
      updateLetterStatus(letter._id, { unread: false });
      updateUnreadLetters(-1);
    }
  };

  // Handle star toggle
  const handleStarToggle = (letter: Letter, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLetterStatus(letter._id, { starred: !letter.starred });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLetters();
    setLastCheckedTimestamp(new Date().toISOString());
    setHasNewLetters(false);
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle approve letter
  const handleApprove = async (letterId: string) => {
    try {
      await axios.post("http://localhost:5000/api/letters/approve", {
        letterId,
        approverId: user._id,
      });

      toast.success("Letter approved successfully!");
      fetchLetters(); // Refresh the letters list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve letter");
    }
  };

  // Handle reject letter
  const handleReject = (letter: Letter) => {
    setPendingActionLetter(letter);
    setRejectionModalOpen(true);
  };

  // Submit rejection
  const submitRejection = async () => {
    if (!pendingActionLetter || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/letters/reject", {
        letterId: pendingActionLetter._id,
        rejectionReason: rejectionReason.trim(),
        rejectorId: user._id,
      });

      toast.success("Letter rejected successfully!");
      setRejectionModalOpen(false);
      setRejectionReason("");
      setPendingActionLetter(null);
      fetchLetters(); // Refresh the letters list
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject letter");
    }
  };

  const handleDownload = async (letterId: string, filename: string) => {
    try {
      setIsDownloadLoading((prev) => ({ ...prev, [filename]: true }));
      const response = await axios.get(
        `http://localhost:5000/api/letters/download/${letterId}/${filename}`,
        { responseType: "blob" }
      );
      if (!response.data || response.data.size === 0) {
        toast.error("File not found or empty.");
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file. Please try again later.");
    } finally {
      setIsDownloadLoading((prev) => ({ ...prev, [filename]: false }));
    }
  };
  const handleView = async (
    letterId: string,
    filename: string,
    contentType: string
  ) => {
    try {
      setIsViewFileLoading((prev) => ({ ...prev, [filename]: true }));
      const response = await axios.get(
        `http://localhost:5000/api/letters/view/${letterId}/${filename}`,
        { responseType: "blob" }
      );
      if (!response.data || response.data.size === 0) {
        toast.error("File not found or empty.");
        return;
      }
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: contentType })
      );
      setPreviewUrl(url);
      setPreviewType(contentType);
      setPreviewVisible(true);
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Failed to preview file. Please try again later.");
    } finally {
      setIsViewFileLoading((prev) => ({ ...prev, [filename]: false }));
    }
  };
  const handlePreviewClose = () => {
    setPreviewVisible(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };
  const handlePrint = () => {
    if (!openLetter) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const ccList = Array.isArray(openLetter.cc)
        ? openLetter.cc.filter(Boolean)
        : typeof openLetter.cc === "string" && openLetter.cc.trim() !== ""
        ? openLetter.cc
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
        : [];
      const departmentLabel = openLetter.department
        ? `<div style='color: #888; font-size: 13px; margin-left: 10px; margin-top: 2px;'>${
            openLetter.department?.split(">")?.pop()?.trim() || ""
          }</div>`
        : "";
      const ccSection =
        ccList.length > 0
          ? `<div style='margin-top: 18px;'><div style='font-weight: 700; color: #555; font-size: 16px; margin-bottom: 2px;'><b>CC:</b></div><div style='color: #222; font-size: 14px; margin-left: 10px;'>${ccList
              .map((cc) => `<div>${cc}</div>`)
              .join("")}</div></div>`
          : "";
      const printContent = `
        <html>
          <head>
            <title>Memo - ${openLetter.subject}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
              body { font-family: 'Roboto', 'Noto Sans Ethiopic', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; -webkit-print-color-adjust: exact; color-adjust: exact; }
              .memo-container { display: flex; flex-direction: column; width: 210mm; height: 297mm; margin: 20px auto; background: white; padding: 20mm; box-sizing: border-box; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              .header { text-align: center; flex-shrink: 0; }
              .logo { height: 60px; margin-bottom: 10px; }
              .institute-name .amharic { font-family: 'Noto Sans Ethiopic', sans-serif; font-weight: 700; font-size: 18px; color: #003F5D; margin: 0; }
              .institute-name .english { font-family: 'Roboto', sans-serif; font-weight: 700; font-size: 16px; color: #000; margin-top: 5px; margin-bottom: 0; }
              .color-bars { display: flex; width: 100%; height: 4px; margin-top: 15px; }
              .color-bars .bar { flex: 1; }
              .color-bars .blue { background-color: #005f9e; }
              .color-bars .brown { background-color: #c88b3d; margin: 0 5px; }
              .color-bars .red { background-color: #d62e2e; }
              .memo-title-section { display: flex; justify-content: space-between; align-items: flex-start; border-top: 2px solid #c88b3d; padding-top: 15px; margin-top: 20px; flex-shrink: 0; }
              .memo-title .amharic { font-family: 'Noto Sans Ethiopic', sans-serif; font-size: 16px; font-weight: 700; margin: 0; }
              .memo-title .english { font-size: 14px; font-weight: 700; margin-top: 5px; }
              .memo-date { text-align: right; font-size: 14px; }
              .memo-date p { margin: 0; }
              .memo-date .date-label { font-size: 12px; color: #555; }
              .memo-body { margin-top: 20px; flex-grow: 1; overflow-y: auto; }
              .signature-section { margin-top: 20px; }
              .signature-section p { margin: 0; }
              .footer { text-align: center; flex-shrink: 0; margin-top: 20px; }
              .footer-line { border-top: 2px solid #003F5D; }
              .footer-content { display: flex; justify-content: space-around; align-items: center; padding: 10px 0; font-size: 11px; }
              .footer-item { display: flex; align-items: center; gap: 5px; }
              .footer-item svg { width: 16px; height: 16px; }
              .footer-quote { margin-top: 10px; font-family: 'Noto Sans Ethiopic', sans-serif; font-style: italic; font-size: 12px; }
              @media print { body { margin: 0; background-color: white; } .memo-container { margin: 0; box-shadow: none; width: 100%; height: 100vh; padding: 15mm; } .memo-body { overflow-y: visible; } }
            </style>
          </head>
          <body>
            <div class="memo-container">
                <div class="header">
                    <img src="${logo}" alt="SSGI Logo" class="logo">
                    <div class="institute-name">
                        <p class="amharic">የቦታዊ ሳይንስና ጂኦስፓሻል ኢንስቲትዩት</p>
                        <p class="english">SPACE SCIENCE AND GEOSPATIAL INSTITUTE</p>
                    </div>
                    <div class="color-bars">
                        <div class="bar blue"></div>
                        <div class="bar brown"></div>
                        <div class="bar red"></div>
                    </div>
                </div>
                <div class="memo-title-section">
                    <div class="memo-title" style="text-align: center; width: 100%;">
                        <p class="amharic" style="margin: 0 auto;">የመውሰጃ ማስታወሻ</p>
                        <p class="english" style="margin: 5px auto 0 auto;">OFFICE MEMO</p>
                    </div>
                    <div class="memo-date">
                        <p><strong>${new Date(
                          openLetter.createdAt
                        ).toLocaleDateString("en-GB")}</strong></p>
                        <p class="date-label">Date</p>
                    </div>
                </div>
                <div class="memo-body">
                    <p><strong>To:</strong> ${getRecipientProfileName(
                      openLetter
                    )}</p>
                    ${departmentLabel}
                    <p style="text-align: left; margin-left: 25%;"><strong>Subject:</strong> ${
                      openLetter.subject
                    }</p>
                    <br>
                    <div class="content-body">${openLetter.content.replace(
                      /\n/g,
                      "<br>"
                    )}</div>
                </div>
                ${ccSection}
                <div class="signature-section" style="margin-top: 40px;">
                    <p>Signature:</p>
                    <p>${openLetter.fromName}</p>
                </div>
                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div class="footer-item"><span>+251 118 96 10 50 / 51</span></div>
                        <div class="footer-item"><span>www.ssgi.gov.et</span></div>
                        <div class="footer-item"><span>33679 / 597</span></div>
                        <div class="footer-item"><span>info@ssgi.gov.et</span></div>
                    </div>
                    <div class="footer-quote"><p>"እምነት እስከ መስክ..."</p></div>
                </div>
            </div>
            <script>window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 500); };</script>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };
  const handleForwardLetter = async () => {
    if (!openLetter) return;
    try {
      setIsForwardLoading(true);
      const recipients = selectedUsers.map((u: any) => ({
        name: u.name,
        email: u.email,
        department: u.department,
      }));
      if (forwardIncludeSender && openLetter) {
        recipients.push({
          name: openLetter.fromName,
          email: openLetter.fromEmail,
          department: openLetter.department,
        });
      }
      const forwardData = {
        subject: `Fwd: ${openLetter.subject}`,
        from: user.email,
        recipients,
        department: selectedDepartment,
        priority: openLetter.priority,
        content: forwardComment
          ? `${forwardComment}\n\n--- Forwarded Message ---\n\n${openLetter.content}`
          : `--- Forwarded Message ---\n\n${openLetter.content}`,
      };
      const response = await axios.post(
        "http://localhost:5000/api/letters/forward",
        forwardData
      );
      if (response.status === 201) {
        setForwardStatus("Message forwarded successfully");
        setTimeout(() => setForwardStatus(null), 3000);
        setShowForwardModal(false);
        setForwardIncludeSender(false);
        setSelectedDepartment("");
        setSelectedUsers([]);
        setForwardComment("");
        fetchLetters();
      } else {
        setForwardStatus(
          "Failed to forward message due to unexpected server response."
        );
      }
    } catch (error: any) {
      setForwardStatus(
        error.response?.data?.error || "Failed to forward message."
      );
    } finally {
      setIsForwardLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md">
            {t.inbox?.title || "Inbox"}
          </h2>
          <p className="text-lg text-[#BFBFBF] font-medium">
            {t.inbox?.manageLetters || "Manage your letters."}
          </p>
          <p className="text-sm text-red-600 mt-2">
            Top-Level Executive Inbox - Full administrative access
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search and Refresh - now always on top */}
          <div className="flex items-center space-x-3 w-full mb-2">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder={t.inbox?.searchPlaceholder || "Search letters..."}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                hasNewLetters ? "animate-pulse" : ""
              }`}
            >
              {isRefreshing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              {isRefreshing
                ? t.inbox?.refreshing || "Refreshing..."
                : t.inbox?.refresh || "Refresh"}
              {hasNewLetters && !isRefreshing && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  New
                </span>
              )}
            </button>
          </div>
          {/* Filter Buttons - now below search/refresh */}
          <div className="flex gap-2">
            {inboxButtons.map((btn) => {
              const isActive = selectedFilter === btn.key;
              return (
                <button
                  key={btn.key}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${getButtonColors(
                    btn.label,
                    isActive
                  )}`}
                  onClick={() => handleFilterChange(btn.key)}
                >
                  <span className="flex items-center gap-2">
                    {btn.label}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${getBadgeColors(
                        btn.label,
                        isActive
                      )}`}
                    >
                      {getFilterCount(letters, btn.label)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mb-4">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-l-lg border border-gray-300 font-medium transition-colors ${
                viewType === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => {
                setViewType("list");
                localStorage.setItem("inboxViewType", "list");
              }}
              aria-label="List view"
            >
              <FaThList className="w-4 h-4" /> List
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-r-lg border border-gray-300 font-medium transition-colors -ml-px ${
                viewType === "card"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 hover:bg-blue-50"
              }`}
              onClick={() => {
                setViewType("card");
                localStorage.setItem("inboxViewType", "card");
              }}
              aria-label="Card view"
            >
              <FaThLarge className="w-4 h-4" /> Card
            </button>
          </div>
        </div>

        {/* Letters List */}
        <div className="bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#BFBFBF] overflow-hidden">
          {loadingLetters ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading your inbox..." />
            </div>
          ) : currentLetters.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-24 h-24 text-gray-300">
                <FileTextIcon className="w-full h-full" />
              </div>
              <p className="mt-4 text-xl text-gray-500">
                {t.inbox?.noLettersFound || "No letters found."}
              </p>
            </div>
          ) : viewType === "list" ? (
            <div className="flex flex-col gap-y-4 divide-y divide-gray-100">
              {currentLetters.map((letter) => (
                <LetterListItem
                  key={letter._id}
                  letter={letter}
                  onOpen={handleLetterOpen}
                  onStarToggle={handleStarToggle}
                  isActive={!!openLetter && openLetter._id === letter._id}
                  user={user}
                  t={t}
                  hideApproveReject={true}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
              {currentLetters.map((letter) => (
                <CardLetterItem
                  key={letter._id}
                  letter={letter}
                  onOpen={handleLetterOpen}
                  onStarToggle={handleStarToggle}
                  user={user}
                  t={t}
                  hideApproveReject={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for letter details and attachments */}
      {openLetter && (
        <Modal
          open={showModal}
          onClose={() => {
            setOpenLetter(null);
            setShowModal(false);
            setViewMode(false);
          }}
          center
          classNames={{
            modal:
              "rounded-2xl shadow-2xl max-w-3xl w-full h-auto max-h-[90vh] flex flex-col",
            overlay: "bg-black/50 backdrop-blur-sm",
          }}
        >
          <div className="p-4 overflow-y-auto">
            {!viewMode ? (
              <div className="bg-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#C88B3D] flex-1 truncate">
                    {openLetter.subject}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.inbox && (t.inbox as any).from
                        ? (t.inbox as any).from
                        : "From"}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.fromName}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.inbox && (t.inbox as any).recipient
                        ? (t.inbox as any).recipient
                        : "Recipient"}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {getRecipientProfileName(openLetter)}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.inbox && (t.inbox as any).departmentLabel
                        ? (t.inbox as any).departmentLabel
                        : "Department"}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.department}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.inbox && (t.inbox as any).date
                        ? (t.inbox as any).date
                        : "Date"}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.createdAt}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">
                    {t.inbox && (t.inbox as any).contentLabel
                      ? (t.inbox as any).contentLabel
                      : "Content"}
                  </div>
                  <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-md p-4 text-gray-800 whitespace-pre-line text-sm shadow-inner">
                    {openLetter.content}
                  </div>
                </div>
                {/* Assignment Note for assigned letters */}
                {openLetter &&
                  openLetter.status === "assigned" &&
                  openLetter.assignComment && (
                    <div className="mb-4">
                      <div className="text-xs text-yellow-700 font-semibold mb-2">
                        Assignment Note
                      </div>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 text-yellow-900 whitespace-pre-line text-sm shadow-inner">
                        {openLetter.assignComment}
                        {openLetter.assignerName && (
                          <div className="mt-2 pt-2 border-t border-yellow-300">
                            <span className="font-semibold">Assigned by:</span>{" "}
                            {openLetter.assignerName} (
                            {openLetter.assignerDepartment ||
                              "Unknown Department"}
                            )
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                {openLetter.attachments &&
                  Array.isArray(openLetter.attachments) &&
                  openLetter.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FaPaperclip />{" "}
                        {(t.inbox as any).attachments || "Attachments"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {openLetter.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-sm text-gray-800 font-medium truncate">
                                {file.filename}
                              </span>
                            </div>
                            <div className="flex space-x-2 items-center shrink-0">
                              <button
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Guess file type from extension
                                  const ext = file.filename
                                    .split(".")
                                    .pop()
                                    ?.toLowerCase();
                                  let type = "";
                                  if (
                                    [
                                      "jpg",
                                      "jpeg",
                                      "png",
                                      "gif",
                                      "bmp",
                                      "webp",
                                    ].includes(ext || "")
                                  ) {
                                    type = `image/${
                                      ext === "jpg" ? "jpeg" : ext
                                    }`;
                                  } else if (ext === "pdf") {
                                    type = "application/pdf";
                                  }
                                  handleView(
                                    openLetter._id,
                                    file.filename,
                                    type
                                  );
                                }}
                              >
                                preview
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(openLetter._id, file.filename);
                                }}
                                disabled={isDownloadLoading[file.filename]}
                                className={`p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-200/70 rounded-md transition-colors duration-200 ${
                                  isDownloadLoading[file.filename]
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                title={(t.inbox as any).download || "Download"}
                              >
                                {isDownloadLoading[file.filename] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent"></div>
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div className="mt-6 flex space-x-3 justify-end">
                  <button
                    onClick={() => setViewMode(true)}
                    className="px-5 py-2 bg-[#C88B3D] text-white rounded-lg shadow-md hover:bg-[#D62E2E] transition-all duration-200 font-semibold text-base"
                  >
                    {(t.inbox as any).viewButton || "View Memo"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                  >
                    {(t.inbox as any).printButton || "Print"}
                  </button>
                  <button
                    onClick={() => setShowForwardModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                  >
                    {(t.inbox as any).forwardButton || "Forward"}
                  </button>
                  {openLetter && openLetter.status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          if (openLetter) {
                            setPendingApproveLetter(openLetter);
                            setApprovalModalOpen(true);
                          }
                        }}
                        className="bg-green-700 text-white px-4 py-2 rounded shadow hover:bg-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (openLetter) handleReject(openLetter);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <TemplateMemoLetter
                  subject={openLetter.subject}
                  date={openLetter.createdAt}
                  recipient={getRecipientProfileName(openLetter)}
                  reference={""}
                  body={openLetter.content}
                  signature={openLetter.fromName}
                />
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setViewMode(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
                  >
                    {(t.inbox as any).backButton || "Back"}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                  >
                    {(t.inbox as any).printButton || "Print"}
                  </button>
                  <button
                    onClick={() => setShowForwardModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                  >
                    {(t.inbox as any).forwardButton || "Forward"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {/* Forward Modal */}
      {showForwardModal && openLetter && (
        <Modal
          open={showForwardModal}
          onClose={() => setShowForwardModal(false)}
          center
          classNames={{ modal: "custom-modal-small" }}
        >
          <div className="p-6 bg-white rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Forward Letter
            </h3>
            <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeSender"
                  checked={forwardIncludeSender}
                  onChange={(e) => setForwardIncludeSender(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="includeSender"
                  className="font-semibold text-blue-700"
                >
                  Include Original Sender:
                </label>
              </div>
              <span className="text-gray-800">{openLetter.fromName}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Select Department
                </label>
                <DepartmentSelector
                  onChange={(value: any) => {
                    setSelectedDepartment(value.fullPath);
                    setSelectedUsers([]);
                  }}
                />
              </div>
              {selectedDepartment && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Select User(s)
                  </label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {departmentUsers
                      .filter(
                        (u: any) =>
                          u.email !== user.email &&
                          u.departmentOrSector &&
                          u.departmentOrSector.trim().toLowerCase() ===
                            selectedDepartment.trim().toLowerCase()
                      )
                      .map((user: any) => (
                        <div
                          key={user._id}
                          className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            id={`user-${user._id}`}
                            checked={selectedUsers.some(
                              (su: any) => su._id === user._id
                            )}
                            onChange={() => {
                              setSelectedUsers((prev: any) =>
                                prev.some((su: any) => su._id === user._id)
                                  ? prev.filter(
                                      (su: any) => su._id !== user._id
                                    )
                                  : [...prev, user]
                              );
                            }}
                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`user-${user._id}`}
                            className="text-sm text-gray-700"
                          >
                            {user.name} ({user.email})
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div>
                <label
                  htmlFor="forwardComment"
                  className="block text-sm font-medium text-gray-600 mb-1"
                >
                  Comment (Optional)
                </label>
                <textarea
                  id="forwardComment"
                  value={forwardComment}
                  onChange={(e) => setForwardComment(e.target.value)}
                  className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add a comment..."
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-semibold"
              >
                {(t.inbox as any).cancel || "Cancel"}
              </button>
              <button
                onClick={handleForwardLetter}
                disabled={
                  isForwardLoading ||
                  (selectedUsers.length === 0 && !forwardIncludeSender)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center text-sm font-semibold"
              >
                {isForwardLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                )}
                {(t.inbox as any).forwardButton || "Forward"}
              </button>
            </div>
            {forwardStatus && (
              <div className="mt-2 text-sm text-green-600">{forwardStatus}</div>
            )}
          </div>
        </Modal>
      )}
      {/* Modal for previewing attachments */}
      <Modal
        open={previewVisible}
        onClose={handlePreviewClose}
        center
        classNames={{
          modal: "rounded-2xl shadow-2xl w-4/5 h-4/5",
          overlay: "bg-black/50 backdrop-blur-sm",
        }}
      >
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
            {previewType.startsWith("image/") ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            ) : previewType === "application/pdf" ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg shadow-lg"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center p-8">
                <FileTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-2">
                  {(t.inbox as any).previewNotAvailable ||
                    "Preview not available."}
                </p>
                <p className="text-sm text-gray-500">
                  {(t.inbox as any).downloadToView ||
                    "Download to view this file."}
                </p>
              </div>
            )}
          </div>
          <div className="p-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={handlePreviewClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              {(t.inbox as any).closeButton || "Close"}
            </button>
            <button
              onClick={() => {
                if (previewUrl) {
                  const link = document.createElement("a");
                  link.href = previewUrl;
                  link.download = "file";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-105"
            >
              {(t.inbox as any).downloadButton || "Download"}
            </button>
          </div>
        </div>
      </Modal>
      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Letter</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectionModalOpen(false);
                  setRejectionReason("");
                  setPendingActionLetter(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Approval Modal */}
      {approvalModalOpen && pendingApproveLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Approve Letter</h3>
            <p className="mb-4">
              Are you sure you want to approve this letter?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setApprovalModalOpen(false);
                  setPendingApproveLetter(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleApprove(pendingApproveLetter._id);
                  setApprovalModalOpen(false);
                  setPendingApproveLetter(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopLevelInbox;
