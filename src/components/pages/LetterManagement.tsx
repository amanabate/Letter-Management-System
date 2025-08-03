import React, { useEffect, useState, useRef } from "react";
import {
  Eye,
  Check,
  Send,
  Download,
  FileCheck,
  Upload,
  Search,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { Modal } from "react-responsive-modal";
import "react-responsive-modal/styles.css";
import TemplateMemoLetter from "./TemplateMemoLetter";
import DepartmentSelector from "./DepartmentSelector";
import LoadingSpinner from "../common/LoadingSpinner";
import { useLanguage } from "./LanguageContext";

const getLetterSentDate = (dateString: string) => {
  const d = new Date(dateString);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

type Letter = {
  _id: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  to?: string;
  toEmail?: string;
  department?: string;
  priority?: string;
  status?: string;
  fileUrl?: string;
  attachmentUrl?: string;
  attachments?: { filename: string }[];
  createdAt: string;
  content?: string;
  rejectionReason?: string;
};

const LetterManagement: React.FC<{
  setSuccessMsg: (msg: string) => void;
  isAdmin?: boolean;
}> = ({ setSuccessMsg, isAdmin }) => {
  const { t } = useLanguage();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [pendingLetters, setPendingLetters] = useState<Letter[]>([]);
  const [rejectedLetters, setRejectedLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptedLetters, setAcceptedLetters] = useState<string[]>([]);
  const [letterSearch, setLetterSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const handleDepartmentChange = (selection: {
    main: string;
    sub: string;
    subSub: string;
    fullPath: string;
    role: string;
  }) => {
    setSelectedDepartment(selection.fullPath);
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [openLetter, setOpenLetter] = useState<Letter | null>(null);
  const [viewMode, setViewMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showAdminApprovalDialog, setShowAdminApprovalDialog] = useState<
    string | null
  >(null);
  const [showRejectModal, setShowRejectModal] = useState<Letter | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all"); // "all", "pending", "rejected"
  const [rejectNotification, setRejectNotification] = useState<{
    show: boolean;
    message: string;
    letterSubject: string;
  }>({ show: false, message: "", letterSubject: "" });
  const [loadingLetters, setLoadingLetters] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: string | null;
  }>({}); // { [letterId]: 'approve'|'reject'|'delete'|null }
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectError, setRejectError] = useState("");
  // Add state for approval modal and comment
  const [showApproveModal, setShowApproveModal] = useState<Letter | null>(null);
  const [approveComment, setApproveComment] = useState("");

  useEffect(() => {
    setLoadingLetters(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userEmail = user.email;

    // For admin users, fetch ALL letters without filtering by userEmail
    if (isAdmin) {
      // Fetch all letters for admin
      axios
        .get(`http://localhost:5000/api/letters?all=true`)
        .then((res: { data: Letter[] }) => {
          console.log("Admin fetched letters:", res.data.length);
          setLetters(res.data);
          setLoadingLetters(false);
        })
        .catch((error: Error) => {
          console.error("Error fetching letters:", error);
          setLetters([]);
          setLoadingLetters(false);
        });

      // Fetch pending letters for admin approval
      axios
        .get(`http://localhost:5000/api/letters/pending`)
        .then((res: { data: Letter[] }) => {
          console.log("Admin fetched pending letters:", res.data.length);
          setPendingLetters(res.data);
        })
        .catch((error) => {
          console.error("Error fetching pending letters:", error);
          setPendingLetters([]);
        });

      // For rejected letters, filter from the main letters array
      axios
        .get(`http://localhost:5000/api/letters?all=true`)
        .then((res: { data: Letter[] }) => {
          const rejected = res.data.filter(
            (letter: Letter) => letter.status === "rejected"
          );
          console.log("Admin fetched rejected letters:", rejected.length);
          setRejectedLetters(rejected);
        })
        .catch((error) => {
          console.error("Error fetching rejected letters:", error);
          setRejectedLetters([]);
        });
    } else {
      // For regular users, fetch their own letters
      const adminAll = isAdmin ? "&all=true" : "";
      axios
        .get(
          `http://localhost:5000/api/letters?userEmail=${encodeURIComponent(
            userEmail
          )}${adminAll}`
        )
        .then((res: { data: Letter[] }) => {
          setLetters(res.data);
          setLoadingLetters(false);
        })
        .catch((error: Error) => {
          setLetters([]);
          setLoadingLetters(false);
        });

      // Fetch pending letters for admin approval
      axios
        .get(
          `http://localhost:5000/api/letters/pending?userEmail=${encodeURIComponent(
            userEmail
          )}${adminAll}`
        )
        .then((res: { data: Letter[] }) => {
          setPendingLetters(res.data);
        })
        .catch(() => setPendingLetters([]));

      // Fetch rejected letters for admin review
      axios
        .get(
          `http://localhost:5000/api/letters?userEmail=${encodeURIComponent(
            userEmail
          )}${adminAll}`
        )
        .then((res: { data: Letter[] }) => {
          const rejected = res.data.filter(
            (letter: Letter) => letter.status === "rejected"
          );
          setRejectedLetters(rejected);
        })
        .catch(() => setRejectedLetters([]));
    }
  }, [isAdmin]);

  const handleApproveLetter = (id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l._id === id ? { ...l, status: "approved" } : l))
    );
    setSuccessMsg(`Letter ${id} approved!`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleSendLetter = (id: string) => {
    setLetters((prev) =>
      prev.map((l) => (l._id === id ? { ...l, status: "sent" } : l))
    );
    setSuccessMsg(`Letter ${id} sent!`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleDetailLetter = (letter: Letter) => {
    setOpenLetter(letter);
    setViewMode(false);
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  const handleAcceptFile = (id: string) => {
    setAcceptedLetters((prev) => [...prev, id]);
    setSuccessMsg(`Letter ${id} accepted by user!`);
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const handleSubmitFileClick = (letterId: string) => {
    if (fileInputRefs.current[letterId]) {
      fileInputRefs.current[letterId]!.value = "";
      fileInputRefs.current[letterId]!.click();
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    letterId: string
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLetters((prevLetters) =>
        prevLetters.map((l) =>
          l._id === letterId
            ? { ...l, attachmentUrl: URL.createObjectURL(file) }
            : l
        )
      );
      setSuccessMsg(
        `File "${file.name}" submitted to letter ${letterId}! (demo)`
      );
      setTimeout(() => setSuccessMsg(""), 2000);
    }
  };

  const handleDeleteLetter = (id: string) => {
    setShowDeleteDialog(id);
  };

  const handleAdminApproval = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    try {
      await axios.delete(`http://localhost:5000/api/letters/${id}`);

      // Update all relevant state variables
      setLetters((prev) => prev.filter((letter) => letter._id !== id));
      setPendingLetters((prev) => prev.filter((letter) => letter._id !== id));
      setRejectedLetters((prev) => prev.filter((letter) => letter._id !== id));

      setSuccessMsg(`Letter ${id} deleted successfully!`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowAdminApprovalDialog(null);
    } catch (error) {
      setSuccessMsg(`Failed to delete letter ${id}. Please try again.`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowAdminApprovalDialog(null);
    }
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  // Direct delete function for non-admin users
  const handleDirectDelete = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    try {
      await axios.delete(`http://localhost:5000/api/letters/${id}`);

      // Update all relevant state variables
      setLetters((prev) => prev.filter((letter) => letter._id !== id));
      setPendingLetters((prev) => prev.filter((letter) => letter._id !== id));
      setRejectedLetters((prev) => prev.filter((letter) => letter._id !== id));

      setSuccessMsg(`Letter ${id} deleted successfully!`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowDeleteDialog(null);
    } catch (error) {
      setSuccessMsg(`Failed to delete letter ${id}. Please try again.`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowDeleteDialog(null);
    }
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  // Approve a pending letter (admin)
  const handleApprovePendingLetter = async (id: string, comment: string = "") => {
    setActionLoading((prev) => ({ ...prev, [id]: "approve" }));
    try {
      await axios.post("http://localhost:5000/api/letters/approve", {
        letterId: id,
        approvalComment: comment,
      });
      setPendingLetters((prev) => prev.filter((l) => l._id !== id));
      setSuccessMsg(`Letter ${id} approved and sent!`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowApproveModal(null);
      setApproveComment("");
    } catch (error) {
      setSuccessMsg(`Failed to approve letter ${id}. Please try again.`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowApproveModal(null);
    }
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  // Reject a pending letter (admin)
  const handleRejectPendingLetter = async (id: string, reason: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "reject" }));
    try {
      await axios.post("http://localhost:5000/api/letters/reject", {
        letterId: id,
        rejectionReason: reason,
      });
      setPendingLetters((prev) => prev.filter((l) => l._id !== id));
      setSuccessMsg(`Letter ${id} rejected and notification sent to sender!`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowRejectModal(null);
      setRejectComment("");
    } catch (error) {
      setSuccessMsg(`Failed to reject letter ${id}. Please try again.`);
      setTimeout(() => setSuccessMsg(""), 2000);
      setShowRejectModal(null);
    }
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  const handlePrint = () => {
    if (!openLetter) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const printContent = `
        <html>
          <head>
            <title>Memo - ${openLetter.subject}</title>
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
                color: #000;
                margin-top: 5px;
                margin-bottom: 0;
              }
              .color-bars {
                display: flex;
                width: 100%;
                height: 4px;
                margin-top: 15px;
              }
              .color-bars .bar { flex: 1; }
              .color-bars .blue { background-color: #005f9e; }
              .color-bars .brown { background-color: #c88b3d; margin: 0 5px; }
              .color-bars .red { background-color: #d62e2e; }
              
              .memo-title-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-top: 2px solid #c88b3d;
                padding-top: 15px;
                margin-top: 20px;
                flex-shrink: 0;
              }
              .memo-title .amharic {
                font-family: 'Noto Sans Ethiopic', sans-serif;
                font-size: 16px;
                font-weight: 700;
                margin: 0;
              }
              .memo-title .english {
                font-size: 14px;
                font-weight: 700;
                margin-top: 5px;
              }
              .memo-date {
                text-align: right;
                font-size: 14px;
              }
              .memo-date p { margin: 0; }
              .memo-date .date-label {
                font-size: 12px;
                color: #555;
              }
              
              .memo-body {
                margin-top: 20px;
                flex-grow: 1;
                overflow-y: auto;
              }
              
              .signature-section {
                margin-top: 20px;
              }
              .signature-section p {
                margin: 0;
              }

              .footer {
                text-align: center;
                flex-shrink: 0;
                margin-top: 20px;
              }
              .footer-line {
                border-top: 2px solid #003F5D;
              }
              .footer-content {
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 10px 0;
                font-size: 11px;
              }
              .footer-item {
                display: flex;
                align-items: center;
                gap: 5px;
              }
              .footer-item svg {
                width: 16px;
                height: 16px;
              }
              .footer-quote {
                margin-top: 10px;
                font-family: 'Noto Sans Ethiopic', sans-serif;
                font-style: italic;
                font-size: 12px;
              }

              @media print {
                body { margin: 0; background-color: white; }
                .memo-container {
                  margin: 0;
                  box-shadow: none;
                  width: 100%;
                  height: 100vh;
                  padding: 15mm;
                }
                .memo-body {
                  overflow-y: visible;
                }
              }
            </style>
          </head>
          <body>
            <div class="memo-container">
                <div class="header">
                    <img src="/logo.png" alt="SSGI Logo" class="logo">
                    <div class="institute-name">
                        <p class="amharic">የኅዋ ሳይንስና ጂኦስፓሻል ኢንስቲዩት</p>
                        <p class="english">SPACE SCIENCE AND GEOSPATIAL INSTITUTE</p>
                    </div>
                    <div class="color-bars">
                        <div class="bar blue"></div>
                        <div class="bar brown"></div>
                        <div class="bar red"></div>
                    </div>
                </div>

                <div class="memo-title-section">
                    <div class="memo-title">
                        <p class="amharic">የውስጥ ማስታወሻ</p>
                        <p class="english">OFFICE MEMO</p>
                    </div>
                    <div class="memo-date">
                        <p><strong>${new Date(
                          openLetter.createdAt
                        ).toLocaleDateString("en-GB")}</strong></p>
                        <p class="date-label">Date</p>
                    </div>
                </div>

                <div class="memo-body">
                    <p><strong>Subject:</strong> ${openLetter.subject}</p>
                    <p><strong>To:</strong> ${
                      openLetter.to || openLetter.toEmail
                    }</p>
                    <br>
                                         <div class="content-body">${(
                                           openLetter.content || ""
                                         ).replace(/\n/g, "<br>")}</div>
                    <div class="signature-section">
                        <p>Signature:</p>
                        <br><br>
                        <p>${openLetter.fromName || "Unknown"}</p>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-line"></div>
                    <div class="footer-content">
                        <div class="footer-item">
                          <svg fill="#c88b3d" viewBox="0 0 24 24"><path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"></path></svg>
                          <span>+251 118 96 10 50 / 51</span>
                        </div>
                        <div class="footer-item">
                           <svg fill="#c88b3d" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A1,1 0 0,0 10,17H14A1,1 0 0,0 15,16V15L19.79,10.21C19.92,10.78 20,11.38 20,12C20,16.08 16.95,19.44 13,19.93V18H11V19.93M17.89,8.11L13,13H11L6.11,8.11C6.5,7.22 7.22,6.5 8.11,6.11L12,10L15.89,6.11C16.78,6.5 17.5,7.22 17.89,8.11Z"></path></svg>
                          <span>www.ssgi.gov.et</span>
                        </div>
                        <div class="footer-item">
                           <svg fill="#c88b3d" viewBox="0 0 24 24"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,11L20,6H4L12,11M20,18V8L12,13L4,8V18H20Z"></path></svg>
                           <span>33679 / 597</span>
                        </div>
                         <div class="footer-item">
                           <svg fill="#c88b3d" viewBox="0 0 24 24"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,11L20,6H4L12,11M20,18V8L12,13L4,8V18H20Z"></path></svg>
                           <span>info@ssgi.gov.et</span>
                        </div>
                    </div>
                    <div class="footer-quote">
                        <p>"ከምድር እስከ ህዋ..."</p>
                    </div>
                </div>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  const container = document.querySelector('.memo-container');
                  const content = document.querySelector('.content-body');
                  if (container.scrollHeight > container.clientHeight) {
                    let fontSize = 12;
                    content.style.fontSize = fontSize + 'px';
                    while (container.scrollHeight > container.clientHeight && fontSize > 6) {
                      fontSize -= 0.5;
                      content.style.fontSize = fontSize + 'px';
                    }
                  }
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  // New simplified reject function for the modal
  const handleRejectLetter = async () => {
    if (!showRejectModal) return;
    setRejectLoading(true);
    setRejectError("");
    try {
      // Use the new reject endpoint
      await axios.post("http://localhost:5000/api/letters/reject", {
        letterId: showRejectModal._id,
        rejectionReason: rejectComment,
      });

      setShowRejectModal(null);
      setRejectComment("");
      setSuccessMsg("Letter rejected successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);

      // Show enhanced notification
      setRejectNotification({
        show: true,
        message:
          "Letter has been successfully rejected and notification sent to the sender.",
        letterSubject: showRejectModal.subject,
      });
      setTimeout(
        () =>
          setRejectNotification({
            show: false,
            message: "",
            letterSubject: "",
          }),
        5000
      );

      // Update UI state
      setPendingLetters((prev) =>
        prev.filter((l) => l._id !== showRejectModal._id)
      );
      setLetters((prev) =>
        prev.map((l) =>
          l._id === showRejectModal._id
            ? { ...l, status: "rejected", rejectionReason: rejectComment }
            : l
        )
      );
      setRejectedLetters((prev) => [
        ...prev,
        {
          ...showRejectModal,
          status: "rejected",
          rejectionReason: rejectComment,
        },
      ]);

      // Refetch letters to ensure UI is updated
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userEmail = user.email;
        const adminAll = isAdmin ? "&all=true" : "";
        const response = await axios.get(
          `http://localhost:5000/api/letters?userEmail=${encodeURIComponent(
            userEmail
          )}${adminAll}`
        );
        setLetters(response.data);
        const rejected = response.data.filter(
          (letter: Letter) => letter.status === "rejected"
        );
        setRejectedLetters(rejected);
      } catch (error) {
        console.error("Error refetching letters:", error);
      }
    } catch (error) {
      setRejectError("Failed to reject letter. Please try again.");
      setSuccessMsg("Failed to reject letter. Please try again.");
      setTimeout(() => setSuccessMsg(""), 2000);
      console.error("Error rejecting letter:", error);
    } finally {
      setRejectLoading(false);
    }
  };

  // Chronological sort (newest first)
  const sortedLetters = [...letters].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredLetters = sortedLetters.filter((letter) => {
    const matchesSearch = (letter.subject || "")
      .toLowerCase()
      .includes(letterSearch.toLowerCase());
    const matchesDepartment =
      !selectedDepartment || letter.department === selectedDepartment;

    // Filter by active filter (all, pending, rejected)
    let matchesActiveFilter = true;
    if (activeFilter === "pending") {
      matchesActiveFilter = letter.status === "pending";
    } else if (activeFilter === "rejected") {
      matchesActiveFilter = letter.status === "rejected";
    }
    // For "all" filter, we show all letters

    return matchesSearch && matchesDepartment && matchesActiveFilter;
  });

  if (loadingLetters) return <LoadingSpinner message="Loading letters..." />;

  return (
    <div className="w-full flex flex-col h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t.letterManagement.title}
        </h2>
        <p className="text-gray-600">{t.letterManagement.subtitle}</p>
      </div>

      {/* Enhanced Notification Bar for Reject & Forward */}
      {rejectNotification.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-auto">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <div>
              <div className="font-semibold">{rejectNotification.message}</div>
              <div className="text-sm opacity-80">
                Subject:{" "}
                <span className="font-medium">
                  {rejectNotification.letterSubject}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === "pending"
                ? "bg-yellow-100 border-yellow-400 shadow-lg"
                : "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
            }`}
            onClick={() => setActiveFilter("pending")}
          >
            <div className="flex items-center">
              <div className="bg-yellow-500 rounded-full p-2 mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {t.letterManagement.pendingApproval}
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  {pendingLetters.length}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === "rejected"
                ? "bg-red-100 border-red-400 shadow-lg"
                : "bg-red-50 border-red-200 hover:bg-red-100"
            }`}
            onClick={() => setActiveFilter("rejected")}
          >
            <div className="flex items-center">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  {t.letterManagement.rejectedLetters}
                </p>
                <p className="text-2xl font-bold text-red-900">
                  {
                    letters.filter((letter) => letter.status === "rejected")
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              activeFilter === "all"
                ? "bg-blue-100 border-blue-400 shadow-lg"
                : "bg-blue-50 border-blue-200 hover:bg-blue-100"
            }`}
            onClick={() => setActiveFilter("all")}
          >
            <div className="flex items-center">
              <div className="bg-blue-500 rounded-full p-2 mr-3">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  {t.letterManagement.totalLetters}
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {letters.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Indicator */}
      {activeFilter !== "all" && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">{t.letterManagement.showing}</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  activeFilter === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {activeFilter === "pending"
                  ? t.letterManagement.pendingLetters
                  : t.letterManagement.rejectedLettersLabel}
              </span>
            </div>
            <button
              onClick={() => setActiveFilter("all")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
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
              {t.letterManagement.showAllLetters}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pending Letters Section */}
        {pendingLetters.length > 0 &&
          (activeFilter === "all" || activeFilter === "pending") && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-yellow-500 rounded-full p-2 mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-800">
                      {t.letterManagement.pendingHighUrgent}
                    </h3>
                    <p className="text-yellow-600 text-sm">
                      {t.letterManagement.requireAdminApproval}
                    </p>
                  </div>
                </div>
                <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {pendingLetters.length} Pending
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingLetters.map((letter) => (
                  <div
                    key={letter._id}
                    className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-semibold text-gray-800 text-lg leading-tight">
                        {letter.subject}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          letter.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {letter.priority}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.from}:</strong>{" "}
                          {letter.fromName || letter.fromEmail}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.to}:</strong> {letter.to || letter.toEmail}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.date}:</strong>{" "}
                          {getLetterSentDate(letter.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          onClick={() => handleDetailLetter(letter)}
                        >
                          <Eye className="w-4 h-4" /> {t.letterManagement.view}
                        </button>
                        <button
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 transition-colors flex items-center justify-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                          onClick={() => {
                            setShowApproveModal(letter);
                            setApproveComment("");
                          }}
                          disabled={actionLoading[letter._id] === "approve"}
                        >
                          {actionLoading[letter._id] === "approve" ? (
                            <Loader2 className="animate-spin w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )} {" "}
                          {t.letterManagement.approve}
                        </button>
                      </div>
                      <button
                        className="w-full bg-red-600 text-white px-3 py-2 rounded-lg shadow hover:bg-red-700 transition-colors flex items-center justify-center gap-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        onClick={() => {
                          setShowRejectModal(letter);
                          setRejectComment("");
                        }}
                        disabled={actionLoading[letter._id] === "reject"}
                      >
                        {actionLoading[letter._id] === "reject" ? (
                          <Loader2 className="animate-spin w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )} {" "}
                        {t.letterManagement.reject}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Rejected Letters Section */}
        {letters.filter((letter) => letter.status === "rejected").length > 0 &&
          (activeFilter === "all" || activeFilter === "rejected") && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-red-500 rounded-full p-2 mr-3">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800">
                      {t.letterManagement.rejectedLetters}
                    </h3>
                    <p className="text-red-600 text-sm">
                      {t.letterManagement.rejectedByAdmin}
                    </p>
                  </div>
                </div>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {
                    letters.filter((letter) => letter.status === "rejected")
                      .length
                  }{" "}
                  Rejected
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {letters
                  .filter((letter) => letter.status === "rejected")
                  .map((letter) => (
                    <div
                      key={letter._id}
                      className="bg-white shadow-lg rounded-xl p-6 border-l-4 border-red-500 hover:shadow-xl transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 text-lg leading-tight">
                          {letter.subject}
                        </h4>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                          {t.letterManagement.rejected}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span>
                            <strong>{t.letterManagement.from}:</strong>{" "}
                            {letter.fromName || letter.fromEmail}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            <strong>{t.letterManagement.to}:</strong> {letter.to || "Unknown"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            <strong>{t.letterManagement.date}:</strong>{" "}
                            {getLetterSentDate(letter.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          onClick={() => handleDetailLetter(letter)}
                        >
                          <Eye className="w-4 h-4" /> {t.letterManagement.viewContent}
                        </button>
                        {/* Delete button removed */}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* All Letters Section */}
        {activeFilter === "all" && (
          <div className="bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-500 rounded-full p-2 mr-3">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {t.letterManagement.allLetters}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {t.letterManagement.allLettersSubtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="w-full lg:w-64">
                  <DepartmentSelector onChange={handleDepartmentChange} />
                </div>
                <div className="flex items-center bg-white border border-gray-300 rounded-lg px-4 py-3 shadow-sm flex-1">
                  <Search className="w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={letterSearch}
                    onChange={(e) => setLetterSearch(e.target.value)}
                    placeholder={t.letterManagement.searchBySubject}
                    className="ml-3 bg-transparent border-none outline-none w-full text-base"
                  />
                </div>
                <span className="text-gray-600 text-base font-medium whitespace-nowrap bg-white px-4 py-3 rounded-lg border border-gray-300">
                  {filteredLetters.length} letter
                  {filteredLetters.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Letters Grid */}
            {filteredLetters.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg">{t.letterManagement.noLettersFound}</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredLetters.map((letter) => (
                  <div
                    key={letter._id}
                    className="bg-white shadow-lg rounded-xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-800 text-lg leading-tight flex-1 pr-2">
                        {letter.subject}
                      </h4>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                          letter.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : letter.status === "sent"
                            ? "bg-blue-100 text-blue-800"
                            : letter.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {letter.status
                          ? letter.status.charAt(0).toUpperCase() +
                            letter.status.slice(1)
                          : "Pending"}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.sender}:</strong>{" "}
                          {letter.fromName || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.receiver}:</strong> {letter.to || "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          <strong>{t.letterManagement.priority}:</strong> {letter.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        className="text-blue-700 underline text-sm flex items-center gap-1 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        onClick={() => handleDetailLetter(letter)}
                      >
                        <Eye className="w-4 h-4" /> {t.letterManagement.details}
                      </button>
                      {/* Delete button removed */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Letter Details Modal (like Inbox) */}
      {openLetter && (
        <Modal
          open={!!openLetter}
          onClose={() => {
            setOpenLetter(null);
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
                {openLetter.status === "rejected" && (
                  <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg shadow">
                    <h4 className="font-bold text-lg mb-2">Letter Rejected</h4>
                    <p>
                      <span className="font-semibold">Rejection Reason:</span>{" "}
                      {openLetter.rejectionReason}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-[#C88B3D] flex-1 truncate">
                    {openLetter.subject}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${
                      openLetter.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : openLetter.priority === "high"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {openLetter.priority
                      ? openLetter.priority.charAt(0).toUpperCase() +
                        openLetter.priority.slice(1)
                      : "Normal"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.letterManagement.from}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.fromName || openLetter.fromEmail}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.letterManagement.recipient}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.to || openLetter.toEmail}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.letterManagement.department}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {openLetter.department || "Unknown"}
                    </div>
                  </div>
                  <div className="bg-gray-100/70 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-semibold mb-1">
                      {t.letterManagement.date}
                    </div>
                    <div className="text-gray-800 font-semibold text-sm truncate">
                      {getLetterSentDate(openLetter.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2">
                    {t.letterManagement.content}
                  </div>
                  <div className="bg-blue-50/50 border-l-4 border-blue-400 rounded-md p-4 text-gray-800 whitespace-pre-line text-sm shadow-inner">
                    {openLetter.content || t.letterManagement.noContent}
                  </div>
                </div>
                {openLetter.attachments &&
                  openLetter.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        📎 {t.letterManagement.attachments}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {openLetter.attachments.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-200 hover:border-blue-400 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <svg
                                className="h-6 w-6 text-gray-500 shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span className="text-sm text-gray-800 font-medium truncate">
                                {file.filename}
                              </span>
                            </div>
                            <div className="flex space-x-2 items-center shrink-0">
                              <a
                                href={`http://localhost:5000/api/letters/view/${
                                  openLetter._id
                                }/${encodeURIComponent(file.filename)}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t.letterManagement.preview}
                              </a>
                              <a
                                href={`http://localhost:5000/api/letters/download/${
                                  openLetter._id
                                }/${encodeURIComponent(file.filename)}`}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-200/70 rounded-md transition-colors duration-200"
                                download={file.filename}
                                title={t.letterManagement.download}
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </a>
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
                    {t.letterManagement.viewContent}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <TemplateMemoLetter
                  subject={openLetter.subject}
                  date={getLetterSentDate(openLetter.createdAt)}
                  recipient={openLetter.to || openLetter.toEmail}
                  reference={""}
                  body={openLetter.content || "No content available."}
                  signature={openLetter.fromName || "Unknown"}
                />
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => setViewMode(false)}
                    className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
                  >
                    {t.letterManagement.back}
                  </button>
                  <button
                    onClick={() => handlePrint()}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    {t.letterManagement.print}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <Modal
          open={!!showDeleteDialog}
          onClose={() => setShowDeleteDialog(null)}
          center
        >
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              {t.letterManagement.deleteConfirm}
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowDeleteDialog(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => handleDirectDelete(showDeleteDialog)}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Approval Dialog */}
      {showAdminApprovalDialog && (
        <Modal
          open={!!showAdminApprovalDialog}
          onClose={() => setShowAdminApprovalDialog(null)}
          center
        >
          <div className="p-4">
            <p className="text-gray-700 mb-4">
              Admin approval required to delete this letter. Are you sure?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => setShowAdminApprovalDialog(null)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                onClick={() => handleAdminApproval(showAdminApprovalDialog)}
                disabled={actionLoading[showAdminApprovalDialog] === "delete"}
              >
                {actionLoading[showAdminApprovalDialog] === "delete" ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : null}{" "}
                Approve
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Letter Modal */}
      {showRejectModal && (
        <Modal
          open={!!showRejectModal}
          onClose={() => {
            setShowRejectModal(null);
            setRejectComment("");
          }}
          center
          classNames={{ modal: "max-w-lg w-full mx-4" }}
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reject & Forward to Sender
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To (Sender)
              </label>
              <input
                type="text"
                value={
                  showRejectModal.fromName || showRejectModal.fromEmail || ""
                }
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={`Rejected letter: ${showRejectModal.subject}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (Reason for Rejection)
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
              />
            </div>
            {rejectError && (
              <div className="text-red-600 text-sm mb-2">{rejectError}</div>
            )}
            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectComment("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={!rejectComment.trim() || rejectLoading}
                onClick={handleRejectLetter}
              >
                Reject & Forward
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Letter Modal */}
      {showApproveModal && (
        <Modal
          open={!!showApproveModal}
          onClose={() => {
            setShowApproveModal(null);
            setApproveComment("");
          }}
          center
          classNames={{ modal: "max-w-lg w-full mx-4" }}
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Approve Letter
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To (Sender)
              </label>
              <input
                type="text"
                value={
                  showApproveModal.fromName || showApproveModal.fromEmail || ""
                }
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={`Approved letter: ${showApproveModal.subject}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comment (Optional)
              </label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="Leave a comment (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => {
                  setShowApproveModal(null);
                  setApproveComment("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                disabled={actionLoading[showApproveModal._id] === "approve"}
                onClick={() => handleApprovePendingLetter(showApproveModal._id, approveComment)}
              >
                {actionLoading[showApproveModal._id] === "approve" ? <Loader2 className="animate-spin w-4 h-4" /> : <Check className="w-4 h-4" />} Approve
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LetterManagement;
