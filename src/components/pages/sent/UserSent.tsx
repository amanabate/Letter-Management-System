import React, { useState, useEffect } from "react";
import { Table, Pagination, Input, Select, Button } from "antd";
import {
  SearchOutlined,
  SendOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import SentLetterItem from "./SentLetterItem";
import { useSent, Letter } from "../../../context/SentContext";
import axios from "axios";
import { Modal } from "antd";
import { FaPaperclip } from "react-icons/fa";
import TemplateMemoLetter from "../TemplateMemoLetter";
import { useLanguage } from "../LanguageContext";

const UserSent: React.FC = () => {
  const { letters, loading, refresh } = useSent();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const itemsPerPage = 15;
  const navigate = useNavigate();
  const [openLetter, setOpenLetter] = useState<Letter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { t } = useLanguage();

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email || "";

  // Filter letters for regular users (only their own sent letters)
  const filterLetters = (allLetters: Letter[]) => {
    return allLetters.filter((letter) => letter.fromEmail === userEmail);
  };

  // Apply search and status filtering
  const filteredLetters = letters.filter((letter) => {
    // First filter by user's own letters
    if (letter.fromEmail !== userEmail) {
      return false;
    }
    // Exclude archived letters
    if (letter.archived) {
      return false;
    }
    // Then apply search filter
    const matchesSearch =
      letter.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.to.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.department.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.content.toLowerCase().includes(searchText.toLowerCase());

    // Then apply status filter
    const matchesStatus =
      statusFilter === "all" || letter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLetters = filteredLetters.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredLetters.length]);

  // Status tracking functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "processing";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "sent":
        return "default";
      case "delivered":
        return "success";
      case "read":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✔️";
      case "rejected":
        return "❌";
      case "sent":
        return "📤";
      case "delivered":
        return "📬";
      case "read":
        return "👁️";
      default:
        return "📧";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return t.sent?.pendingApproval || "Pending Approval";
      case "approved":
        return t.sent?.approved || "Approved";
      case "rejected":
        return t.sent?.rejected || "Rejected";
      case "sent":
        return t.sent?.sent || "Sent";
      case "delivered":
        return t.sent?.delivered || "Delivered";
      case "read":
        return t.sent?.read || "Read";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusDescription = (letter: Letter) => {
    switch (letter.status) {
      case "pending":
        return (
          t.sent?.waitingForApproval || "Waiting for higher-level approval"
        );
      case "approved":
        return letter.approvedAt
          ? `${t.sent?.approvedOn || "Approved on"} ${new Date(
              letter.approvedAt
            ).toLocaleDateString()}`
          : t.sent?.approved || "Approved";
      case "rejected":
        return letter.rejectedAt
          ? `${t.sent?.rejectedOn || "Rejected on"} ${new Date(
              letter.rejectedAt
            ).toLocaleDateString()}`
          : t.sent?.rejected || "Rejected";
      case "sent":
        return t.sent?.letterHasBeenSent || "Letter has been sent";
      case "delivered":
        return t.sent?.letterHasBeenDelivered || "Letter has been delivered";
      case "read":
        return t.sent?.letterHasBeenRead || "Letter has been read";
      default:
        return "";
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const [viewedRejections, setViewedRejections] = useState<Set<string>>(
    new Set()
  );
  const [expandedRejections, setExpandedRejections] = useState<Set<string>>(
    new Set()
  );
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [isViewFileLoading, setIsViewFileLoading] = useState<{
    [key: string]: boolean;
  }>({});

  const handleView = async (
    letterId: string,
    filename: string,
    contentType: string,
    letterObj?: Letter
  ) => {
    if (filename && contentType) {
      try {
        setIsViewFileLoading((prev) => ({ ...prev, [filename]: true }));
        const response = await axios.get(
          `http://localhost:5000/api/letters/view/${letterId}/${filename}`,
          { responseType: "blob" }
        );
        if (!response.data || response.data.size === 0) {
          alert("File not found or empty.");
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
        alert("Failed to preview file. Please try again later.");
      } finally {
        setIsViewFileLoading((prev) => ({ ...prev, [filename]: false }));
      }
      return;
    }
    // fallback: open memo modal
    if (letterObj) {
      setOpenLetter(letterObj);
      setShowModal(true);
    } else {
      const found = letters.find((l) => l._id === letterId);
      if (found) {
        setOpenLetter(found);
        setShowModal(true);
      }
    }
  };
  const handlePreviewClose = () => {
    setPreviewVisible(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (letterId: string, filename: string) => {
    // This will be handled by BaseSent
  };

  const handleMemoView = (letter: Letter) => {
    setOpenLetter(letter);
    setShowModal(true);
  };

  const handleRejectionClick = (letterId: string) => {
    setViewedRejections((prev) => new Set([...prev, letterId]));
    setExpandedRejections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(letterId)) {
        newSet.delete(letterId);
      } else {
        newSet.add(letterId);
      }
      return newSet;
    });
  };

  const shouldTruncateRejection = (reason: string) => {
    return reason.length > 80;
  };

  const getTruncatedRejection = (reason: string) => {
    return reason.length > 80 ? reason.substring(0, 80) + "..." : reason;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C88B3D] to-[#BFBFBF] drop-shadow-lg">
            {t.sent?.mySentLetters || "My Sent Letters"}
          </h1>
        </div>
        <p className="text-lg text-gray-500 font-medium">
          {t.sent?.mySentLettersSubtitle ||
            "Track all the letters you have sent"}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="flex gap-4 w-full md:w-auto">
          <Input
            placeholder={t.sent?.searchPlaceholder || "Search letters..."}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs rounded-lg shadow-sm border-blue-200 focus:border-blue-400"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40 rounded-lg shadow-sm border-blue-200"
          >
            <Select.Option value="all">
              {t.sent?.allStatus || "All Status"}
            </Select.Option>
            <Select.Option value="delivered">
              {t.sent?.statusDelivered || "Delivered"}
            </Select.Option>
            <Select.Option value="pending">
              {t.sent?.statusPending || "Pending"}
            </Select.Option>
            <Select.Option value="approved">
              {t.sent?.statusApproved || "Approved"}
            </Select.Option>
            <Select.Option value="rejected">
              {t.sent?.statusRejected || "Rejected"}
            </Select.Option>
            <Select.Option value="normal">
              {t.sent?.priorityNormal || "Normal"}
            </Select.Option>
            <Select.Option value="high">
              {t.sent?.priorityHigh || "High"}
            </Select.Option>
            <Select.Option value="urgent">
              {t.sent?.priorityUrgent || "Urgent"}
            </Select.Option>
          </Select>
          <div className="flex gap-1">
            <Button
              type="text"
              icon={<AppstoreOutlined />}
              onClick={() => setViewType("grid")}
              className={
                viewType === "grid"
                  ? "text-white bg-[#003F5D]"
                  : "text-gray-500"
              }
            />
            <Button
              type="text"
              icon={<BarsOutlined />}
              onClick={() => setViewType("list")}
              className={
                viewType === "list"
                  ? "text-white bg-[#003F5D]"
                  : "text-gray-500"
              }
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
              ? t.sent?.refreshing || "Refreshing..."
              : t.sent?.refresh || "Refresh"}
          </button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            className="bg-gradient-to-r from-[#C88B3D] to-[#BFBFBF] text-[#003F5D] border-0 shadow-lg hover:from-[#BFBFBF] hover:to-[#C88B3D] transition-all duration-300"
            onClick={() => navigate("/new-letter")}
          >
            {t.sent?.newLetterButton || "New Letter"}
          </Button>
        </div>
      </div>

      <div className="w-full">
        {viewType === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentLetters.map((letter) => (
              <SentLetterItem
                key={letter._id}
                letter={letter}
                viewType={viewType}
                onView={(letterId, filename, contentType) =>
                  handleView(letterId, filename, contentType)
                }
                onDownload={handleDownload}
                onMemoView={handleMemoView}
                onRejectionClick={handleRejectionClick}
                getPriorityClass={getPriorityClass}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                getStatusDescription={getStatusDescription}
                viewedRejections={viewedRejections}
                expandedRejections={expandedRejections}
                shouldTruncateRejection={shouldTruncateRejection}
                getTruncatedRejection={getTruncatedRejection}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentLetters.map((letter) => (
              <SentLetterItem
                key={letter._id}
                letter={letter}
                viewType={viewType}
                onView={(letterId, filename, contentType) =>
                  handleView(letterId, filename, contentType)
                }
                onDownload={handleDownload}
                onMemoView={handleMemoView}
                onRejectionClick={handleRejectionClick}
                getPriorityClass={getPriorityClass}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                getStatusDescription={getStatusDescription}
                viewedRejections={viewedRejections}
                expandedRejections={expandedRejections}
                shouldTruncateRejection={shouldTruncateRejection}
                getTruncatedRejection={getTruncatedRejection}
              />
            ))}
          </div>
        )}

        {filteredLetters.length > 0 && (
          <div className="flex justify-center mt-8">
            <Pagination
              current={currentPage}
              total={filteredLetters.length}
              pageSize={itemsPerPage}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} ${
                  t.sent?.paginationText || "letters"
                }`
              }
            />
          </div>
        )}

        {filteredLetters.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {t.sent?.noSentLettersFound || "No sent letters found"}
            </div>
            <p className="text-gray-400">
              {t.sent?.noSentLettersMessage ||
                "You haven't sent any letters yet. Start by composing a new letter."}
            </p>
          </div>
        )}
      </div>
      {/* Letter Content Modal */}
      {openLetter && (
        <Modal
          open={showModal}
          onCancel={() => {
            setOpenLetter(null);
            setShowModal(false);
          }}
          footer={null}
          width={700}
          title={t.sent?.letterDetails || "Letter Details"}
        >
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#C88B3D] flex-1 truncate">
                {openLetter.subject}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
                  openLetter.priority
                )}`}
              >
                {openLetter.priority.charAt(0).toUpperCase() +
                  openLetter.priority.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-100/70 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  {t.sent?.to || "To"}
                </div>
                <div className="text-gray-800 font-semibold text-sm truncate">
                  {openLetter.to}
                </div>
              </div>
              <div className="bg-gray-100/70 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  {t.sent?.department || "Department"}
                </div>
                <div className="text-gray-800 font-semibold text-sm truncate">
                  {openLetter.department}
                </div>
              </div>
              <div className="bg-gray-100/70 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  {t.sent?.date || "Date"}
                </div>
                <div className="text-gray-800 font-semibold text-sm truncate">
                  {openLetter.createdAt}
                </div>
              </div>
              <div className="bg-gray-100/70 rounded-lg p-3">
                <div className="text-xs text-gray-500 font-semibold mb-1">
                  {t.sent?.status || "Status"}
                </div>
                <div className="text-gray-800 font-semibold text-sm truncate">
                  {getStatusText(openLetter.status)}
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="text-xs text-gray-500 font-semibold mb-2">
                {t.sent?.content || "Content"}
              </div>
              <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-md p-4 text-gray-800 whitespace-pre-line text-sm shadow-inner">
                {openLetter.content}
              </div>
            </div>
            {openLetter.attachments && openLetter.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaPaperclip /> {t.sent?.attachments || "Attachments"}
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
                        <Button
                          type="link"
                          onClick={() =>
                            handleDownload(openLetter._id, file.filename)
                          }
                        >
                          {t.sent?.downloadButton || "Download"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {/* Memo Modal (TemplateMemoLetter) */}
      {openLetter && (
        <Modal
          open={showModal}
          onCancel={() => {
            setOpenLetter(null);
            setShowModal(false);
          }}
          footer={null}
          width={800}
          title="Memo View"
        >
          <TemplateMemoLetter
            subject={openLetter.subject}
            date={openLetter.createdAt}
            recipient={openLetter.to}
            body={openLetter.content}
            signature={openLetter.fromName}
          />
        </Modal>
      )}
      {/* File Preview Modal */}
      {previewVisible && (
        <Modal
          open={previewVisible}
          onCancel={handlePreviewClose}
          footer={null}
          width={900}
          title={t.sent?.filePreview || "File Preview"}
        >
          <div className="w-full h-[70vh] flex flex-col">
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
                  <FaPaperclip className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-xl text-gray-600 mb-2">
                    {t.sent?.previewNotAvailable || "Preview not available."}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.sent?.downloadToView || "Download to view this file."}
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-200 flex justify-end space-x-3">
              <Button onClick={handlePreviewClose}>
                {t.sent?.closeButton || "Close"}
              </Button>
              <Button
                type="primary"
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
              >
                {t.sent?.downloadButton || "Download"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserSent;
