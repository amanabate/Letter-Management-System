import React, { useState, useRef } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Badge,
} from "antd";
import {
  SearchOutlined,
  SendOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PrinterOutlined,
  MailOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import TemplateMemoLetter from "../TemplateMemoLetter";
import { useLanguage } from "../LanguageContext";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useSent, Letter } from "../../../context/SentContext";
import ErrorBoundary from "../../common/ErrorBoundary";
import logo from "../../../img icon/logo.png";

interface Attachment {
  filename: string;
  contentType: string;
  uploadDate: string;
}

interface BaseSentProps {
  title?: string;
  subtitle?: string;
  filterLetters?: (letters: Letter[]) => Letter[];
  children?: React.ReactNode;
}

const BaseSent: React.FC<BaseSentProps> = ({
  title = "Sent Letters",
  subtitle = "Easily track and manage all your sent correspondence",
  filterLetters,
  children,
}) => {
  const { letters, loading, fetchLetters, refresh } = useSent();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [composeVisible, setComposeVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewType, setPreviewType] = useState<string>("");
  const [memoViewVisible, setMemoViewVisible] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [form] = Form.useForm();
  const [attachment, setAttachment] = useState<File | null>(null);
  const memoPrintRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [viewedRejections, setViewedRejections] = useState<Set<string>>(
    new Set()
  );
  const [expandedRejections, setExpandedRejections] = useState<Set<string>>(
    new Set()
  );

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email || "";

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = async (letterId: string, filename: string) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/letters/download/${letterId}/${filename}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(t.sent?.errorDownloadingFile || "Error downloading file");
    }
  };

  const handleView = async (
    letterId: string,
    filename: string,
    contentType: string
  ) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/letters/view/${letterId}/${filename}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: contentType })
      );
      setPreviewUrl(url);
      setPreviewType(contentType);
      setPreviewVisible(true);
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error(t.sent?.errorViewingFile || "Error viewing file");
    }
  };

  const handlePreviewClose = () => {
    setPreviewVisible(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const handleMemoView = (letter: Letter) => {
    setSelectedLetter(letter);
    setMemoViewVisible(true);
  };

  const handlePrint = () => {
    if (!selectedLetter) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Memo - ${selectedLetter.subject}</title>
            <style>
              @import url("https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap");
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
              
              body {
                font-family: 'Roboto', 'Noto Sans Ethiopic', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .memo-container {
                display: flex;
                flex-direction: column;
                width: 210mm;
                height: 297mm;
                margin: 20px auto;
                background: white;
                padding: 20mm;
                box-sizing: border-box;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                flex-shrink: 0;
              }
              .logo {
                height: 60px;
                margin-bottom: 10px;
              }
              .institute-name .amharic {
                font-family: 'Noto Sans Ethiopic', sans-serif;
                font-weight: 700;
                font-size: 18px;
                color: #003F5D;
                margin: 0;
              }
              .institute-name .english {
                font-family: 'Roboto', sans-serif;
                font-weight: 700;
                font-size: 16px;
                color: #003F5D;
                margin: 0;
              }
              .memo-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 20px 0;
              }
              .memo-header {
                text-align: center;
                margin-bottom: 30px;
              }
              .memo-title {
                font-family: 'Noto Sans Ethiopic', sans-serif;
                font-size: 24px;
                font-weight: 700;
                color: #003F5D;
                margin-bottom: 10px;
              }
              .memo-subtitle {
                font-family: 'Roboto', sans-serif;
                font-size: 18px;
                color: #666;
                margin-bottom: 20px;
              }
              .memo-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .detail-item {
                display: flex;
                flex-direction: column;
              }
              .detail-label {
                font-weight: 600;
                color: #003F5D;
                margin-bottom: 5px;
                font-size: 14px;
              }
              .detail-value {
                color: #333;
                font-size: 16px;
              }
              .memo-body {
                line-height: 1.8;
                color: #333;
                font-size: 16px;
                text-align: justify;
              }
              .footer {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .signature-section {
                text-align: center;
              }
              .signature-line {
                width: 200px;
                height: 1px;
                background-color: #333;
                margin: 40px auto 10px;
              }
              .signature-name {
                font-weight: 600;
                color: #003F5D;
                margin-bottom: 5px;
              }
              .signature-title {
                color: #666;
                font-size: 14px;
              }
              .date-section {
                text-align: right;
              }
              .date-label {
                font-weight: 600;
                color: #003F5D;
                margin-bottom: 5px;
              }
              .date-value {
                color: #333;
              }
              @media print {
                body { margin: 0; }
                .memo-container { 
                  box-shadow: none; 
                  margin: 0;
                  padding: 15mm;
                }
              }
            </style>
          </head>
          <body>
            <div class="memo-container">
              <div class="header">
                <img src="${logo}" alt="Logo" class="logo">
                <div class="institute-name">
                  <div class="amharic">የኢትዮጵያ ፌዴራላዊ ዲሞክራሲያዊ ሪፐብሊክ</div>
                  <div class="english">FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA</div>
                </div>
              </div>
              
              <div class="memo-content">
                <div class="memo-header">
                  <div class="memo-title">የደብዳቤ ማስታወሻ</div>
                  <div class="memo-subtitle">MEMORANDUM</div>
                </div>
                
                <div class="memo-details">
                  <div class="detail-item">
                    <div class="detail-label">ወደ / To:</div>
                    <div class="detail-value">${selectedLetter.to}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">ከ / From:</div>
                    <div class="detail-value">${selectedLetter.fromName}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">መደብ / Department:</div>
                    <div class="detail-value">${selectedLetter.department}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">ቀን / Date:</div>
                    <div class="detail-value">${new Date(selectedLetter.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div class="memo-body">
                  ${selectedLetter.content}
                </div>
              </div>
              
              <div class="footer">
                <div class="signature-section">
                  <div class="signature-line"></div>
                  <div class="signature-name">${selectedLetter.fromName}</div>
                  <div class="signature-title">Sender</div>
                </div>
                <div class="date-section">
                  <div class="date-label">Date:</div>
                  <div class="date-value">${new Date(selectedLetter.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
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

  const tableColumns = [
    {
      title: t.sent?.subjectColumn || "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string, record: Letter) => (
        <div className="flex items-center gap-2">
          {record.status === "pending" && (
            <span title="Pending" className="text-yellow-500 text-lg">
              ⏳
            </span>
          )}
          {record.status === "approved" && (
            <span title="Approved" className="text-green-600 text-lg">
              ✔️
            </span>
          )}
          <div className="font-semibold text-base text-gray-800">{subject}</div>
          {record.status === "rejected" && record.rejectionReason && (
            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium">
              <span className="font-bold">Rejection Reason:</span>{" "}
              {record.rejectionReason}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t.sent?.toColumn || "To",
      dataIndex: "to",
      key: "to",
    },
    {
      title: t.sent?.departmentColumn || "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: t.sent?.dateColumn || "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: t.sent?.statusColumn || "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : status === "approved"
              ? "bg-green-100 text-green-800"
              : status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: t.sent?.priorityColumn || "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityClass(
            priority
          )}`}
        >
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </span>
      ),
    },
    {
      title: t.sent?.attachmentsColumn || "Attachments",
      key: "attachments",
      render: (record: Letter) => (
        <div className="flex gap-2">
          {record.attachments && record.attachments.length > 0 ? (
            record.attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-1">
                <PaperClipOutlined className="text-gray-600" />
                <span className="text-sm text-gray-600">
                  {attachment.filename}
                </span>
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    handleView(
                      record._id,
                      attachment.filename,
                      attachment.contentType
                    )
                  }
                  size="small"
                />
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    handleDownload(record._id, attachment.filename)
                  }
                  size="small"
                />
              </div>
            ))
          ) : (
            <span className="text-gray-400">{t.sent?.noAttachments || "No attachments"}</span>
          )}
        </div>
      ),
    },
    {
      title: t.sent?.memoViewColumn || "Memo View",
      key: "memoView",
      render: (record: Letter) => (
        <Button
          type="link"
          icon={<FileTextOutlined />}
          onClick={() => handleMemoView(record)}
          size="small"
        >
          {t.sent?.viewMemoButton || "View Memo"}
        </Button>
      ),
    },
  ];

  // Filter letters based on search and status
  const filteredLetters = letters.filter((letter) => {
    const matchesSearch =
      letter.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.to.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.department.toLowerCase().includes(searchText.toLowerCase()) ||
      letter.content.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || letter.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Apply custom filter if provided
  const finalLetters = filterLetters ? filterLetters(filteredLetters) : filteredLetters;

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
        return <ClockCircleOutlined />;
      case "approved":
        return <CheckCircleOutlined />;
      case "rejected":
        return <CloseCircleOutlined />;
      case "sent":
        return <SendOutlined />;
      case "delivered":
        return <CheckCircleOutlined />;
      case "read":
        return <CheckCircleOutlined />;
      default:
        return <MailOutlined />;
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

  // Table columns for status tracking
  const statusColumns = [
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (text: string, record: Letter) => (
        <div className="font-medium text-[#003F5D] hover:text-[#C88B3D] cursor-pointer">
          {text}
        </div>
      ),
    },
    {
      title: "Recipient",
      dataIndex: "to",
      key: "to",
      render: (text: string) => <div className="text-gray-700">{text}</div>,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (text: string) => <div className="text-gray-600">{text}</div>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag
          color={
            priority === "urgent"
              ? "red"
              : priority === "high"
              ? "orange"
              : "blue"
          }
          className="font-medium"
        >
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Letter) => (
        <Tooltip title={getStatusDescription(record)}>
          <Badge
            status={getStatusColor(status) as any}
            text={
              <span className="font-medium">
                {getStatusIcon(status)} {getStatusText(status)}
              </span>
            }
          />
        </Tooltip>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div className="text-gray-500">
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (record: Letter) => (
        <div className="flex gap-2">
          {record.attachments && record.attachments.length > 0 && (
            <Tooltip title="View Attachment">
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() =>
                  handleView(
                    record._id,
                    record.attachments[0]?.filename,
                    record.attachments[0]?.contentType
                  )
                }
              />
            </Tooltip>
          )}
          <Tooltip title="View Memo">
            <Button
              type="text"
              icon={<FileTextOutlined />}
              size="small"
              onClick={() => handleMemoView(record)}
            />
          </Tooltip>
          {record.status === "rejected" && record.rejectionReason && (
            <Tooltip title="View Rejection Reason">
              <Button
                type="text"
                icon={<ExclamationCircleOutlined />}
                size="small"
                danger
                onClick={() => handleRejectionClick(record._id)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // Pagination logic
  const totalPages = Math.ceil(finalLetters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLetters = finalLetters.slice(startIndex, endIndex);

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

  const handleSendLetter = async (values: {
    subject: string;
    recipient: string;
    content: string;
    department: string;
  }) => {
    try {
      const formData = new FormData();
      formData.append("subject", values.subject);
      formData.append("to", values.recipient);
      formData.append("content", values.content);
      formData.append("department", values.department);
      formData.append("priority", "normal");
      formData.append("fromEmail", userEmail);

      if (attachment) {
        formData.append("attachment", attachment);
      }

      const response = await axios.post(
        "http://localhost:5000/api/letters",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      refresh();
      toast.success(t.sent?.letterSentSuccess || "Letter sent successfully!");
      setComposeVisible(false);
      form.resetFields();
      setAttachment(null);
    } catch (error) {
      console.error("Error sending letter:", error);
      toast.error(t.sent?.failedToSendLetter || "Failed to send letter");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
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

  const shouldShowRejectionBanner = () => {
    const rejectedLetters = letters.filter(
      (letter) => letter.status === "rejected"
    );
    return (
      rejectedLetters.length > 0 &&
      rejectedLetters.some((letter) => !viewedRejections.has(letter._id))
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-2">
          <MailOutlined className="text-4xl text-[#C88B3D] animate-bounce" />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C88B3D] to-[#BFBFBF] drop-shadow-lg">
            {title}
          </h1>
        </div>
        <p className="text-lg text-gray-500 font-medium">{subtitle}</p>
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
            <Select.Option value="approved">Approved</Select.Option>
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

      {children}

      {/* Compose Modal */}
      <Modal
        title={t.sent?.composeNewLetter || "Compose New Letter"}
        open={composeVisible}
        onCancel={() => {
          setComposeVisible(false);
          setAttachment(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSendLetter}>
          <Form.Item
            label={t.sent?.subjectLabel || "Subject"}
            name="subject"
            rules={[{ required: true, message: t.sent?.subjectRequired || "Subject is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t.sent?.recipientLabel || "Recipient"}
            name="recipient"
            rules={[{ required: true, message: t.sent?.recipientRequired || "Recipient is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t.sent?.departmentLabel || "Department"}
            name="department"
            rules={[{ required: true, message: t.sent?.departmentRequired || "Department is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t.sent?.contentLabel || "Content"}
            name="content"
            rules={[{ required: true, message: t.sent?.contentRequired || "Content is required" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label={t.sent?.attachmentsLabel || "Attachments"}>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {attachment && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <PaperClipOutlined />
                  <span>{attachment.name}</span>
                  <Button
                    type="link"
                    danger
                    onClick={removeAttachment}
                    size="small"
                  >
                    {t.sent?.removeAttachment || "Remove"}
                  </Button>
                </div>
              )}
            </div>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              block
            >
              {t.sent?.sendLetterButton || "Send Letter"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="File Preview"
        open={previewVisible}
        onCancel={handlePreviewClose}
        footer={null}
        width={800}
        destroyOnClose
      >
        {previewType.startsWith("image/") ? (
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-auto max-h-96 object-contain"
          />
        ) : (
          <iframe
            src={previewUrl}
            className="w-full h-96 border-0"
            title="File Preview"
          />
        )}
      </Modal>

      {/* Memo View Modal */}
      <Modal
        title="Memo View"
        open={memoViewVisible}
        onCancel={() => setMemoViewVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>,
          <Button key="close" onClick={() => setMemoViewVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {selectedLetter && (
          <div ref={memoPrintRef}>
            <TemplateMemoLetter letter={selectedLetter} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BaseSent; 