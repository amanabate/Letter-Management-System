import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaRegFileAlt } from "react-icons/fa";
import TemplateMemoLetter from "../TemplateMemoLetter";
import { useLanguage } from "../LanguageContext";
import { toast } from "react-toastify";

const AssignedTasks: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [progressComment, setProgressComment] = useState("");
  const [progressStatus, setProgressStatus] = useState("in_progress");
  const [addingProgress, setAddingProgress] = useState(false);
  const [showOriginalLetter, setShowOriginalLetter] = useState(false);
  const [originalLetter, setOriginalLetter] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const { t, lang } = useLanguage();
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const statusOptions = [
    { value: "assigned", label: t.taskAssigned?.statusAssigned || "Assigned" },
    {
      value: "in_progress",
      label: t.taskAssigned?.statusInProgress || "In Progress",
    },
    {
      value: "completed",
      label: t.taskAssigned?.statusCompleted || "Completed",
    },
    { value: "closed", label: t.taskAssigned?.statusClosed || "Closed" },
  ];

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/letters/assigned?assignedToId=${currentUser.email}`
      );
      setTasks(res.data);
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to fetch assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks();
    setIsRefreshing(false);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Filter tasks based on search
  const filteredTasks = tasks
    .filter((task) => {
      const searchLower = search.toLowerCase();
      return (
        task.subject?.toLowerCase().includes(searchLower) ||
        task.to?.toLowerCase().includes(searchLower) ||
        task.recipientName?.toLowerCase().includes(searchLower) ||
        task.recipientEmail?.toLowerCase().includes(searchLower) ||
        task.assignComment?.toLowerCase().includes(searchLower) ||
        task.status?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

  useEffect(() => {
    if (currentUser._id) fetchTasks();
  }, [currentUser._id]);

  const openTaskModal = async (task: any) => {
    setSelectedTask(task);
    setProgress([]);
    setProgressLoading(true);
    setProgressError(null);
    setOriginalLetter(null);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/letters/progress/${task._id}`
      );
      setProgress(res.data.progress || []);
      // If the assigned letter has an originalLetter, fetch it
      if (task.originalLetter) {
        const origRes = await axios.get(
          `http://localhost:5000/api/letters/${task.originalLetter}`
        );
        setOriginalLetter(origRes.data);
      }
    } catch (e: any) {
      setProgressError(
        e.response?.data?.message || "Failed to fetch progress history."
      );
    } finally {
      setProgressLoading(false);
    }
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    setProgress([]);
    setProgressComment("");
    setProgressStatus("in_progress");
    setProgressError(null);
    setShowOriginalLetter(false);
  };

  const handleAddProgress = async () => {
    if (!progressComment.trim()) return;
    setAddingProgress(true);
    try {
      await axios.post("http://localhost:5000/api/letters/progress", {
        letterId: selectedTask._id,
        userId: currentUser._id,
        comment: progressComment,
        status: progressStatus,
      });
      // Refresh progress
      const res = await axios.get(
        `http://localhost:5000/api/letters/progress/${selectedTask._id}`
      );
      setProgress(res.data.progress || []);
      setProgressComment("");
      setProgressStatus("in_progress");
    } catch (e: any) {
      setProgressError(e.response?.data?.message || "Failed to add progress.");
    } finally {
      setAddingProgress(false);
    }
  };

  // Approve handler
  const handleApprove = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await axios.post("http://localhost:5000/api/letters/approve", {
        letterId: selectedTask._id,
        approverId: currentUser._id,
      });
      toast.success("Letter approved successfully!");
      closeTaskModal();
      fetchTasks();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to approve letter.");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject handler
  const handleReject = async () => {
    if (!selectedTask || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await axios.post("http://localhost:5000/api/letters/reject", {
        letterId: selectedTask._id,
        rejectionReason,
      });
      toast.success("Letter rejected successfully!");
      setShowRejectModal(false);
      closeTaskModal();
      fetchTasks();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to reject letter.");
    } finally {
      setActionLoading(false);
      setRejectionReason("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h2 className="text-3xl font-bold mb-6 text-main-text">
        {t.taskAssigned?.title || "Assigned Tasks"}
      </h2>

      {/* Search and Refresh Controls */}
      <div className="flex items-center space-x-3 w-full mb-6">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder={
              t.taskAssigned?.searchPlaceholder || "Search assigned tasks..."
            }
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm bg-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
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
            ? t.taskAssigned?.refreshing || "Refreshing..."
            : t.taskAssigned?.refresh || "Refresh"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {loading ? (
          <div className="text-blue-600 font-medium">
            {t.taskAssigned?.loading || "Loading tasks..."}
          </div>
        ) : error ? (
          <div className="text-red-600 font-medium">{error}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-gray-700">
            {search
              ? t.taskAssigned?.noSearchResults ||
                "No tasks found matching your search."
              : t.taskAssigned?.noTasks || "No tasks assigned to you."}
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-white">
                <th className="py-3 px-4 rounded-l-xl text-left">
                  {t.taskAssigned?.subject || "Subject"}
                </th>
                <th className="py-3 px-4 text-left">
                  {t.taskAssigned?.recipient || "Recipient"}
                </th>
                <th className="py-3 px-4 text-left">
                  {t.taskAssigned?.dateAssigned || "Date Assigned"}
                </th>
                <th className="py-3 px-4 text-left">
                  {t.taskAssigned?.status || "Status"}
                </th>
                <th className="py-3 px-4 text-left">
                  {t.taskAssigned?.assignmentComment || "Assignment Comment"}
                </th>
                <th className="py-3 px-4 text-left">Assigned by</th>
                <th className="py-3 px-4 rounded-r-xl text-left">
                  {t.taskAssigned?.actions || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task, idx) => (
                <tr
                  key={task._id || idx}
                  className="bg-white hover:bg-[#f9f5f0] transition"
                >
                  <td className="py-2 px-4 font-medium text-main-text">
                    {task.subject}
                  </td>
                  <td className="py-2 px-4 text-gray-700">
                    {task.to || task.recipientName || task.recipientEmail}
                  </td>
                  <td className="py-2 px-4 text-gray-700">
                    {new Date(
                      task.updatedAt || task.createdAt
                    ).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.status === "assigned"
                          ? "bg-yellow-100 text-yellow-700"
                          : task.status === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : task.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : task.status === "closed"
                          ? "bg-gray-300 text-gray-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusOptions.find((opt) => opt.value === task.status)
                        ?.label ||
                        task.status?.replace("_", " ")?.toUpperCase() ||
                        "ASSIGNED"}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-700">
                    {task.assignComment || (
                      <span className="italic text-gray-400">
                        {t.taskAssigned?.assignmentCommentEmpty || "No comment"}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-gray-700">
                    {task.assignerName ? (
                      <span>
                        {task.assignerName} (
                        {task.assignerDepartment || "Unknown Department"})
                      </span>
                    ) : (
                      <span className="italic text-gray-400">Unknown</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <button
                      className="px-3 py-1 bg-[#b97b2a] text-white rounded shadow hover:bg-hover-gold font-semibold"
                      onClick={() => openTaskModal(task)}
                    >
                      {t.taskAssigned?.view || "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for task details and progress */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-4 relative flex flex-col items-center justify-center border border-[#b97b2a] animate-zoom-modal">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold transition-colors duration-200"
              onClick={closeTaskModal}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-3 text-main-text text-center w-full border-b pb-2">
              {t.taskAssigned?.letterDetails || "Letter Details"}
            </h3>
            <div className="flex justify-center mb-4">
              <button
                className="flex items-center gap-1 px-4 py-2 bg-blue-100 rounded-lg hover:bg-blue-200 text-blue-700 font-semibold focus:outline-none border border-blue-200 shadow transition-all duration-200"
                title={t.taskAssigned?.viewAssignedLetter || "View Assigned Letter with Instructions"}
                onClick={() => {
                  setShowOriginalLetter(true);
                }}
              >
                <FaRegFileAlt size={20} />
                <span style={{ fontSize: "1em" }}>
                  {t.taskAssigned?.viewOriginal || "View Original"}
                </span>
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 w-full max-h-[60vh] overflow-y-auto">
              {/* Left Column: Letter Details */}
              <div className="flex-1 min-w-[250px] border-r border-gray-200 pr-6">
                <div className="mb-4">
                  <div className="font-semibold text-[#b97b2a] mb-2 text-lg">
                    {t.taskAssigned?.letterInfo || "Letter Info"}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {t.taskAssigned?.subject || "Subject"}:
                    </span>{" "}
                    {selectedTask.subject}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {t.taskAssigned?.recipient || "Recipient"}:
                    </span>{" "}
                    {selectedTask.to}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {t.taskAssigned?.dateAssigned || "Date Assigned"}:
                    </span>{" "}
                    {new Date(
                      selectedTask.updatedAt || selectedTask.createdAt
                    ).toLocaleString()}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {t.taskAssigned?.assignmentComment ||
                        "Assignment Comment"}
                      :
                    </span>{" "}
                    {selectedTask.assignComment || (
                      <span className="italic text-gray-400">
                        {t.taskAssigned?.assignmentCommentEmpty || "No comment"}
                      </span>
                    )}
                  </div>
                  {/* Show assigner information visually clear */}
                  {selectedTask.assignerName && (
                    <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <span className="font-semibold text-blue-700">
                        Assigned by:
                      </span>{" "}
                      <span className="text-blue-900 font-medium">
                        {selectedTask.assignerName} (
                        {selectedTask.assignerDepartment ||
                          "Unknown Department"}
                        )
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <span className="font-semibold">
                      {t.taskAssigned?.status || "Status"}:
                    </span>{" "}
                    {selectedTask.status?.replace("_", " ")?.toUpperCase()}
                  </div>
                </div>
                {/* Approve/Reject Buttons for assigned tasks */}
                {selectedTask.status === "assigned" && (
                  <div className="flex gap-4 mb-4">
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 font-semibold transition-all duration-200"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 font-semibold transition-all duration-200"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {/* Reject Modal */}
                {showRejectModal && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative flex flex-col items-center justify-center border border-[#b97b2a]">
                      <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold transition-colors duration-200"
                        onClick={() => setShowRejectModal(false)}
                      >
                        &times;
                      </button>
                      <h4 className="text-xl font-bold mb-4 text-red-700">
                        Reject Letter
                      </h4>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-600 focus:border-red-600 mb-4"
                        rows={4}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                      />
                      <div className="flex gap-2 justify-end w-full">
                        <button
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                          onClick={() => setShowRejectModal(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow"
                          onClick={handleReject}
                          disabled={!rejectionReason.trim() || actionLoading}
                        >
                          {actionLoading ? "Rejecting..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Show original letter content in a popup/section */}
                {showOriginalLetter && originalLetter && (
                  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 relative flex flex-col items-center justify-center border border-[#b97b2a]">
                      <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-2xl font-bold transition-colors duration-200"
                        onClick={() => setShowOriginalLetter(false)}
                      >
                        &times;
                      </button>
                      <div className="w-full max-h-[80vh] overflow-y-auto flex items-center justify-center">
                        <TemplateMemoLetter
                          subject={selectedTask.subject}
                          date={selectedTask.createdAt}
                          recipient={selectedTask.to}
                          body={selectedTask.content}
                          signature={selectedTask.fromName}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedTasks;
