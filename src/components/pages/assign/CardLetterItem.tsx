import React, { useEffect, useState } from "react";
import { StarIcon, Paperclip, ArchiveIcon } from "lucide-react";
import {
  Letter,
  getPriorityBadge,
  getSenderDisplayName,
  getLetterSentDate,
} from "../inbox/BaseInbox";
import Modal from "./Modal";
import axios from "axios";
import { toast } from "react-toastify";

interface CardLetterItemProps {
  letter: Letter;
  onOpen: (letter: Letter) => void;
  onStarToggle: (letter: Letter, e: React.MouseEvent) => void;
  user: any;
  t: any;
  getRecipientProfileName?: (letter: Letter) => string;
  hideApproveReject?: boolean;
}

const CardLetterItem: React.FC<CardLetterItemProps> = ({
  letter,
  onOpen,
  onStarToggle,
  user,
  t,
  getRecipientProfileName,
  hideApproveReject,
}) => {
  const isRegularUser = user.role === "user";
  const isAdminUser = user.role === "admin";
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignComment, setAssignComment] = useState("");
  const [assignRecipient, setAssignRecipient] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [pendingActionLetter, setPendingActionLetter] = useState<Letter | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        setUsers(res.data);
      } catch (e) {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Filtering logic (copied from NewLetter)
  const currentUser = user;
  const topLevelRoles = [
    "director_general",
    "deputy_director_general",
    "executive_advisor",
  ];
  function isSubCategoryDirectorOffice(u: any) {
    const deptParts = (u.departmentOrSector || "")
      .split(">")
      .map((s: string) => s.trim());
    return u.role === "director_office" && deptParts.length === 2;
  }
  function isExecutiveHeadOfSubSubCategory(u: any, subCategoryPath: string) {
    const deptParts = (u.departmentOrSector || "")
      .split(">")
      .map((s: string) => s.trim());
    return (
      u.role === "executive_head" &&
      deptParts.length === 3 &&
      deptParts.slice(0, 2).join(" > ") === subCategoryPath
    );
  }
  function isUnderSameSubSubCategory(u: any, currentUserDeptPath: string) {
    const deptParts = (u.departmentOrSector || "")
      .split(">")
      .map((s: string) => s.trim());
    return (
      deptParts.length === 3 && deptParts.join(" > ") === currentUserDeptPath
    );
  }
  function isUnderSameSubCategoryDifferentSubSub(
    u: any,
    currentUserDeptPath: string
  ) {
    const deptParts = (u.departmentOrSector || "")
      .split(">")
      .map((s: string) => s.trim());
    const currentDeptParts = currentUserDeptPath
      .split(">")
      .map((s: string) => s.trim());
    return (
      deptParts.length === 3 &&
      deptParts.slice(0, 2).join(" > ") ===
        currentDeptParts.slice(0, 2).join(" > ") &&
      deptParts.join(" > ") !== currentUserDeptPath
    );
  }
  let filteredUsers: any[] = [];
  if (topLevelRoles.includes(currentUser.role)) {
    filteredUsers = users.filter((u) => {
      if (isSubCategoryDirectorOffice(u)) return true;
      if (topLevelRoles.includes(u.role) && u._id !== currentUser._id)
        return true;
      return false;
    });
  } else if (currentUser.role === "director_office") {
    const myDeptParts = (currentUser.departmentOrSector || "")
      .split(">")
      .map((s: string) => s.trim());
    const mySubCategory = myDeptParts.slice(0, 2).join(" > ");
    filteredUsers = users.filter((u) => {
      if (isSubCategoryDirectorOffice(u) && u._id !== currentUser._id)
        return true;
      if (topLevelRoles.includes(u.role)) return true;
      if (isExecutiveHeadOfSubSubCategory(u, mySubCategory)) return true;
      return false;
    });
  } else if (currentUser.role === "executive_head") {
    const myDeptPath = currentUser.departmentOrSector || "";
    const myDeptParts = myDeptPath.split(">").map((s: string) => s.trim());
    const mySubCategory = myDeptParts.slice(0, 2).join(" > ");
    filteredUsers = users.filter((u) => {
      if (u._id === currentUser._id) return false;
      if (isUnderSameSubSubCategory(u, myDeptPath)) return true;
      if (
        isUnderSameSubCategoryDifferentSubSub(u, myDeptPath) &&
        u.role === "executive_head"
      )
        return true;
      if (
        u.role === "director_office" &&
        u.departmentOrSector === mySubCategory
      )
        return true;
      return false;
    });
  } else if (currentUser.role === "user") {
    const myDeptPath = currentUser.departmentOrSector || "";
    const myDeptParts = myDeptPath.split(">").map((s: string) => s.trim());
    if (myDeptParts.length === 3) {
      filteredUsers = users.filter((u) => {
        if (u._id === currentUser._id) return false;
        if (isUnderSameSubSubCategory(u, myDeptPath)) return true;
        if (u.role === "executive_head" && u.departmentOrSector === myDeptPath)
          return true;
        return false;
      });
    } else {
      filteredUsers = [];
    }
  } else {
    filteredUsers = [];
  }

  const handleAssign = async () => {
    if (!assignRecipient || !assignComment.trim()) {
      toast.error("Please select a recipient and provide a comment.");
      return;
    }
    setAssignLoading(true);
    try {
      await axios.post("http://localhost:5000/api/letters/assign-task", {
        letterId: letter._id,
        recipientId: assignRecipient,
        comment: assignComment,
        assignerId: user._id,
      });
      toast.success("Task assigned successfully!");
      setAssignModalOpen(false);
      window.location.reload();
      // Optionally: remove letter from inbox UI (requires prop or context update)
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to assign task.");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleApprove = async (letterId: string) => {
    try {
      await axios.post("http://localhost:5000/api/letters/approve", {
        letterId,
        approverId: user._id,
      });
      toast.success("Letter approved successfully!");
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to approve letter.");
    }
  };

  const handleReject = async () => {
    if (!pendingActionLetter || !rejectionReason.trim()) return;
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
      window.location.reload();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to reject letter.");
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setArchiving(true);
    try {
      await axios.post("http://localhost:5000/api/letters/status", {
        letterId: letter._id,
        archived: true,
      });
      toast.success("Letter archived successfully!");
      setArchiveModalOpen(false);
      window.location.reload(); // Or trigger a refetch in parent
    } catch (err) {
      toast.error("Failed to archive letter.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-200 p-5 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all duration-200 relative ${
        letter.unread ? "ring-2 ring-blue-400" : ""
      }`}
      onClick={() => onOpen(letter)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">
          {getLetterSentDate(letter.createdAt)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStarToggle(letter, e);
          }}
          className={`p-1 rounded-full transition-colors ${
            letter.starred
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-gray-400 hover:text-yellow-500"
          }`}
          aria-label="Star letter"
        >
          <StarIcon
            className={`w-5 h-5 ${letter.starred ? "fill-current" : ""}`}
          />
        </button>
      </div>
      <div className="mb-2 flex items-center gap-2">
        {getPriorityBadge(letter.priority, t)}
        {/* Assigned Task Indicator */}
        {letter.status === "assigned" && (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Assigned
          </span>
        )}
        {letter.status && letter.status !== "assigned" && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              letter.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : letter.status === "approved"
                ? "bg-green-100 text-green-700"
                : letter.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-[#194A8D] mb-1 truncate">
        {letter.subject}
      </h3>
      <div className="flex flex-col gap-1 text-xs text-gray-600 mt-auto">
        <div>
          <span className="font-semibold">From:</span>{" "}
          {getSenderDisplayName(letter)}
        </div>
        <div>
          <span className="font-semibold">To:</span>{" "}
          {getRecipientProfileName
            ? getRecipientProfileName(letter)
            : letter.toName ||
              (letter.toEmail ? letter.toEmail.split("@")[0] : "")}
        </div>
        <div>
          <span className="font-semibold">Department:</span>{" "}
          {letter.department.split(/[_ ]/).pop()}
        </div>
        {/* Show assigner information for assigned letters */}
        {letter.status === "assigned" && letter.assignerName && (
          <div>
            <span className="font-semibold">Assigned by:</span>{" "}
            {letter.assignerName} (
            {letter.assignerDepartment || "Unknown Department"})
          </div>
        )}
        {letter.attachments && letter.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-[#D29341] mt-1">
            <Paperclip className="w-4 h-4" /> {letter.attachments.length}{" "}
            attachment(s)
          </div>
        )}
      </div>
      {/* Show action buttons for assigned letters - assigned users can approve/reject */}
      {(letter.status === "assigned" || (!isRegularUser && !isAdminUser)) && (
        <>
          {/* Assign Task Button - Always visible for non-regular users */}
          {!isRegularUser && !isAdminUser && letter.status !== "assigned" && (
            <div className="mt-4 flex flex-row gap-3 justify-center items-center">
              <button
                className="px-2 py-1 text-xs bg-[#b97b2a] text-white rounded shadow hover:bg-hover-gold font-semibold"
                style={{ minWidth: "90px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignModalOpen(true);
                }}
              >
                Assign Task
              </button>
            </div>
          )}

          {/* Approve/Reject Buttons - Show for assigned letters or when hideApproveReject is false */}
          {(!hideApproveReject || letter.status === "assigned") && (
            <div className="mt-2 flex flex-row gap-3 justify-center items-center">
              <button
                className="px-2 py-1 text-xs bg-green-600 text-white rounded shadow hover:bg-green-700 font-semibold ml-1"
                style={{ minWidth: "70px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(letter._id);
                }}
              >
                Approve
              </button>
              <button
                className="px-2 py-1 text-xs bg-red-600 text-white rounded shadow hover:bg-red-700 font-semibold"
                style={{ minWidth: "70px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setRejectionModalOpen(true);
                  setPendingActionLetter(letter);
                }}
              >
                Reject
              </button>
            </div>
          )}
          <Modal
            isOpen={rejectionModalOpen}
            onClose={() => setRejectionModalOpen(false)}
            title="Reject Letter"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-600 focus:border-red-600"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                onClick={() => setRejectionModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold shadow"
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
              >
                Reject
              </button>
            </div>
          </Modal>
          <Modal
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            title="Assign Task"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment/Instruction
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-hover-gold focus:border-hover-gold"
                rows={4}
                value={assignComment}
                onChange={(e) => setAssignComment(e.target.value)}
                placeholder="Enter instructions or comments..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-hover-gold focus:border-hover-gold"
                value={assignRecipient}
                onChange={(e) => setAssignRecipient(e.target.value)}
                disabled={loadingUsers}
              >
                <option value="">
                  {loadingUsers ? "Loading users..." : "Select recipient..."}
                </option>
                {filteredUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-hover-gold text-white hover:bg-[#b97b2a] font-semibold shadow"
                onClick={handleAssign}
                disabled={
                  assignLoading || !assignRecipient || !assignComment.trim()
                }
              >
                {assignLoading ? "Assigning..." : "Assign"}
              </button>
            </div>
          </Modal>
        </>
      )}
      {/* Archive Button */}
      <div className="mt-2 flex flex-row gap-3 justify-center items-center">
        <button
          className="px-2 py-1 text-xs bg-gray-500 text-white rounded shadow hover:bg-gray-700 font-semibold"
          style={{ minWidth: "70px" }}
          onClick={e => {
            e.stopPropagation();
            setArchiveModalOpen(true);
          }}
        >
          <ArchiveIcon className="w-4 h-4 inline-block mr-1" /> Archive
        </button>
      </div>
      <Modal
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title="Archive Letter"
      >
        <div className="mb-4">Are you sure you want to archive this letter? You can restore it later from the Archive section.</div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
            onClick={() => setArchiveModalOpen(false)}
            disabled={archiving}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-800 font-semibold shadow"
            onClick={handleArchive}
            disabled={archiving}
          >
            {archiving ? "Archiving..." : "Archive"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CardLetterItem;
