import React from "react";
import { Button, Tag, Tooltip } from "antd";
import {
  PaperClipOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Letter } from "../../../context/SentContext";
import axios from "axios";
import { message, Modal as AntdModal } from "antd";

interface SentLetterItemProps {
  letter: Letter;
  viewType: "grid" | "list";
  onView: (letterId: string, filename: string, contentType: string) => void;
  onDownload: (letterId: string, filename: string) => void;
  onMemoView: (letter: Letter) => void;
  onRejectionClick: (letterId: string) => void;
  getPriorityClass: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusText: (status: string) => string;
  getStatusDescription: (letter: Letter) => string;
  viewedRejections: Set<string>;
  expandedRejections: Set<string>;
  shouldTruncateRejection: (reason: string) => boolean;
  getTruncatedRejection: (reason: string) => string;
}

const SentLetterItem: React.FC<SentLetterItemProps> = ({
  letter,
  viewType,
  onView,
  onDownload,
  onMemoView,
  onRejectionClick,
  getPriorityClass,
  getStatusColor,
  getStatusIcon,
  getStatusText,
  getStatusDescription,
  viewedRejections,
  expandedRejections,
  shouldTruncateRejection,
  getTruncatedRejection,
}) => {
  const [archiveModalOpen, setArchiveModalOpen] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setArchiving(true);
    try {
      await axios.post("http://localhost:5000/api/letters/status", {
        letterId: letter._id,
        archived: true,
      });
      message.success("Letter archived successfully!");
      setArchiveModalOpen(false);
      window.location.reload(); // Or trigger a refetch in parent
    } catch (err) {
      message.error("Failed to archive letter.");
    } finally {
      setArchiving(false);
    }
  };

  if (viewType === "grid") {
    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            {letter.status === "pending" && (
              <span title="Pending" className="text-yellow-500 text-lg">
                ⏳
              </span>
            )}
            {letter.status === "approved" && (
              <span title="Approved" className="text-green-600 text-lg">
                ✔️
              </span>
            )}
            <h3 className="font-bold text-lg text-[#003F5D] hover:text-[#C88B3D] transition-colors duration-300 cursor-pointer">
              {letter.subject}
            </h3>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
              letter.priority
            )}`}
          >
            {letter.priority.charAt(0).toUpperCase() + letter.priority.slice(1)}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">To:</span>
            <span>{letter.to}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">Department:</span>
            <span>{letter.department}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-semibold">Date:</span>
            <span>{new Date(letter.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-600">Status:</span>
            <Tag
              color={
                letter.status === "pending"
                  ? "processing"
                  : letter.status === "approved"
                  ? "success"
                  : letter.status === "rejected"
                  ? "error"
                  : "default"
              }
              className="font-medium"
            >
              {getStatusIcon(letter.status)} {getStatusText(letter.status)}
            </Tag>
          </div>
        </div>

        {letter.status === "rejected" && letter.rejectionReason && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationCircleOutlined className="text-red-600" />
              <span className="font-semibold text-red-800">
                Rejection Reason:
              </span>
            </div>
            <p className="text-sm text-red-700">
              {expandedRejections.has(letter._id)
                ? letter.rejectionReason
                : getTruncatedRejection(letter.rejectionReason)}
            </p>
            {shouldTruncateRejection(letter.rejectionReason) && (
              <Button
                type="link"
                size="small"
                className="p-0 h-auto text-red-600 hover:text-red-800"
                onClick={() => onRejectionClick(letter._id)}
              >
                {expandedRejections.has(letter._id) ? "Show less" : "Show more"}
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {letter.attachments && letter.attachments.length > 0 ? (
            letter.attachments.map((attachment, idx) => (
              <Button
                key={idx}
                type="link"
                icon={<PaperClipOutlined />}
                className="text-[#003F5D] hover:text-[#C88B3D]"
                onClick={() =>
                  onView(
                    letter._id,
                    attachment.filename,
                    attachment.contentType
                  )
                }
              >
                {attachment.filename}
              </Button>
            ))
          ) : (
            <span className="text-[#BFBFBF] italic">No attachments</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="default"
            icon={<EyeOutlined />}
            className="hover:bg-[#003F5D]/10 hover:text-[#003F5D]"
            onClick={() =>
              onView(
                letter._id,
                letter.attachments[0]?.filename,
                letter.attachments[0]?.contentType
              )
            }
            disabled={!letter.attachments || letter.attachments.length === 0}
          >
            View
          </Button>
          <Button
            type="default"
            icon={<FileTextOutlined />}
            className="hover:bg-[#C88B3D]/10 hover:text-[#C88B3D]"
            onClick={() => onMemoView(letter)}
          >
            Memo
          </Button>
          <Button
            type="default"
            icon={<InboxOutlined />}
            className="hover:bg-gray-200 hover:text-gray-700"
            onClick={e => {
              e.stopPropagation();
              setArchiveModalOpen(true);
            }}
          >
            Archive
          </Button>
          <AntdModal
            open={archiveModalOpen}
            onCancel={() => setArchiveModalOpen(false)}
            title="Archive Letter"
            footer={[
              <Button key="cancel" onClick={() => setArchiveModalOpen(false)} disabled={archiving}>Cancel</Button>,
              <Button key="archive" type="primary" danger loading={archiving} onClick={handleArchive}>Archive</Button>,
            ]}
          >
            Are you sure you want to archive this letter? You can restore it later from the Archive section.
          </AntdModal>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          <div className="flex items-center gap-4">
            <span
              className={`font-bold text-lg transition-colors duration-300 ${
                letter.status === "pending"
                  ? "text-yellow-800 group-hover:text-yellow-900"
                  : letter.status === "rejected"
                  ? "text-red-800 group-hover:text-red-900"
                  : letter.status === "approved"
                  ? "text-green-800 group-hover:text-green-900"
                  : "text-[#003F5D] group-hover:text-[#C88B3D]"
              }`}
            >
              {letter.subject}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityClass(
                letter.priority
              )}`}
            >
              {letter.priority.charAt(0).toUpperCase() +
                letter.priority.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            To: <span className="font-medium">{letter.to}</span> | Dept:{" "}
            <span className="font-medium">{letter.department}</span>
          </p>

          {letter.status === "assigned" && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 ml-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Assigned
            </span>
          )}

          {letter.status === "rejected" && letter.rejectionReason && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <span className="font-bold">Rejection Reason:</span>{" "}
              {expandedRejections.has(letter._id)
                ? letter.rejectionReason
                : getTruncatedRejection(letter.rejectionReason)}
              {shouldTruncateRejection(letter.rejectionReason) && (
                <Button
                  type="link"
                  size="small"
                  className="p-0 h-auto ml-1 text-red-600 hover:text-red-800"
                  onClick={() => onRejectionClick(letter._id)}
                >
                  {expandedRejections.has(letter._id)
                    ? "Show less"
                    : "Show more"}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {new Date(letter.createdAt).toLocaleDateString()}
            </div>
            <Tag color={getStatusColor(letter.status)} className="font-medium">
              {getStatusIcon(letter.status)} {getStatusText(letter.status)}
            </Tag>
          </div>

          {/* Attachment icon and actions */}
          {letter.attachments && letter.attachments.length > 0 && (
            <Tooltip title="View Attachment">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  onView(
                    letter._id,
                    letter.attachments[0]?.filename,
                    letter.attachments[0]?.contentType
                  )
                }
              />
            </Tooltip>
          )}
          <div className="flex gap-2">
            {letter.attachments && letter.attachments.length > 0 && (
              <Tooltip title="View Memo">
                <Button
                  type="text"
                  icon={<FileTextOutlined />}
                  size="small"
                  onClick={() => onMemoView(letter)}
                />
              </Tooltip>
            )}
            {letter.status === "rejected" && letter.rejectionReason && (
              <Tooltip title="View Rejection Reason">
                <Button
                  type="text"
                  icon={<ExclamationCircleOutlined />}
                  size="small"
                  danger
                  onClick={() => onRejectionClick(letter._id)}
                />
              </Tooltip>
            )}
            <Button
              type="default"
              icon={<InboxOutlined />}
              className="hover:bg-gray-200 hover:text-gray-700"
              onClick={e => {
                e.stopPropagation();
                setArchiveModalOpen(true);
              }}
            >
              Archive
            </Button>
            <AntdModal
              open={archiveModalOpen}
              onCancel={() => setArchiveModalOpen(false)}
              title="Archive Letter"
              footer={[
                <Button key="cancel" onClick={() => setArchiveModalOpen(false)} disabled={archiving}>Cancel</Button>,
                <Button key="archive" type="primary" danger loading={archiving} onClick={handleArchive}>Archive</Button>,
              ]}
            >
              Are you sure you want to archive this letter? You can restore it later from the Archive section.
            </AntdModal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentLetterItem;
