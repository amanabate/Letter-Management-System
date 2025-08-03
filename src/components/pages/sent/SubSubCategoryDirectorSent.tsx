import React, { useState, useEffect } from "react";
import { Table, Pagination } from "antd";
import BaseSent from "./BaseSent";
import SentLetterItem from "./SentLetterItem";
import { useSent, Letter } from "../../../context/SentContext";
import { useLanguage } from "../LanguageContext";

const SubSubCategoryDirectorSent: React.FC = () => {
  const { letters, loading } = useSent();
  const [currentPage, setCurrentPage] = useState(1);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const itemsPerPage = 15;
  const { t } = useLanguage();

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email || "";
  const userDepartment = user.department || "";

  // Filter letters for sub-sub-category directors (letters from their sub-sub-category)
  const filterLetters = (allLetters: Letter[]) => {
    return allLetters.filter((letter) => {
      // Exclude archived letters
      if (letter.archived) return false;
      // Include letters sent by the director themselves
      if (letter.fromEmail === userEmail) {
        return true;
      }
      // Include letters from their sub-sub-category
      const letterDepartment = letter.department || "";
      return letterDepartment.includes(userDepartment) || 
             userDepartment.includes(letterDepartment);
    });
  };

  const filteredLetters = filterLetters(letters);

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
        return "Pending Approval";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusDescription = (letter: Letter) => {
    switch (letter.status) {
      case "pending":
        return "Waiting for higher-level approval";
      case "approved":
        return letter.approvedAt
          ? `Approved on ${new Date(letter.approvedAt).toLocaleDateString()}`
          : "Approved";
      case "rejected":
        return letter.rejectedAt
          ? `Rejected on ${new Date(letter.rejectedAt).toLocaleDateString()}`
          : "Rejected";
      case "sent":
        return "Letter has been sent";
      case "delivered":
        return "Letter has been delivered";
      case "read":
        return "Letter has been read";
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

  const [viewedRejections, setViewedRejections] = useState<Set<string>>(new Set());
  const [expandedRejections, setExpandedRejections] = useState<Set<string>>(new Set());

  const handleView = async (
    letterId: string,
    filename: string,
    contentType: string
  ) => {
    // This will be handled by BaseSent
  };

  const handleDownload = async (letterId: string, filename: string) => {
    // This will be handled by BaseSent
  };

  const handleMemoView = (letter: Letter) => {
    // This will be handled by BaseSent
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
    <BaseSent
      title={t.sent?.subSubCategoryDirectorSentLetters || "Sub-Sub-Category Director Sent Letters"}
      subtitle={`${t.sent?.subSubCategoryDirectorSentLettersSubtitle || "Manage sent letters from"} ${userDepartment} ${t.sent?.subSubCategoryDirectorSentLettersSubtitle ? "" : "sub-sub-category"}`}
      filterLetters={filterLetters}
    >
      <div className="w-full">
        {viewType === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentLetters.map((letter) => (
              <SentLetterItem
                key={letter._id}
                letter={letter}
                viewType={viewType}
                onView={handleView}
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
                onView={handleView}
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
                `${range[0]}-${range[1]} of ${total} letters`
              }
            />
          </div>
        )}

        {filteredLetters.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No sent letters found
            </div>
            <p className="text-gray-400">
              No letters have been sent from your sub-sub-category yet.
            </p>
          </div>
        )}
      </div>
    </BaseSent>
  );
};

export default SubSubCategoryDirectorSent; 