import React, { useState, useEffect, useRef } from "react";
import { PaperclipIcon, SendIcon, SaveIcon } from "lucide-react";
import CCSection from "./Employees";
import { useLanguage } from "./LanguageContext";
import axios from "axios";
import TemplateMemoLetter from "./TemplateMemoLetter";
import DepartmentSelector from "./DepartmentSelector";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../types/letter.d.ts"; // Corrected the import path for letter.d.ts
import { useSent } from "../../context/SentContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { useLetterForm } from "../../context/LetterFormContext";
import type { LetterData } from "../../types/letter.d";
import { FaUser, FaBuilding } from "react-icons/fa";

const NewLetter = () => {
  const { lang, setLang } = useLanguage();
  const { refresh } = useSent?.() || { refresh: undefined };
  const {
    department,
    setDepartment,
    recipient,
    setRecipient,
    reset,
    users,
    loadingUsers,
    fetchUsers,
    fetchDepartments,
  } = useLetterForm();

  const [letterData, setLetterData] = useState<LetterData>({
    subject: "",
    to: "",
    department: "",
    priority: "normal",
    content: "",
    attachments: [],
    cc: [],
    ccEmployees: {},
    from: "",
  });

  const [attachment, setAttachment] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sending, setSending] = useState(false);

  const departmentSelectorRef = useRef<{ reset: () => void }>(null);
  const [selectedDepartmentSelection, setSelectedDepartmentSelection] = useState({
    main: "",
    sub: "",
    subSub: "",
    fullPath: "",
    role: "",
  });

  const t = {
    title: {
      en: "Create New Letter",
      am: "አዲስ ደብዳቤ ይፃፉ",
    },
    subtitle: {
      en: "Compose and send a new letter",
      am: "አዲስ ደብዳቤ ይፃፉ እና ይላኩ",
    },
    department: {
      en: "Department",
      am: "መደብ",
    },
    to: {
      en: "To",
      am: "ወደ",
    },
    subject: {
      en: "Subject",
      am: "ርዕስ",
    },
    priority: {
      en: "Priority",
      am: "ቅደም ተከተል",
    },
    content: {
      en: "Content",
      am: "ይዘት",
    },
    attachments: {
      en: "Attachments",
      am: "አባሪዎች",
    },
    upload: {
      en: "Upload a file",
      am: "ፋይል ያስገቡ",
    },
    orDrag: {
      en: "or drag and drop",
      am: "ወደዚህ ይጎትቱ",
    },
    uploadHint: {
      en: "PDF, DOC up to 10MB",
      am: "ፒዲኤፍ፣ ዶክ እስከ 10MB",
    },
    send: {
      en: "Send Letter",
      am: "ደብዳቤ ላክ",
    },
    saveDraft: {
      en: "Save as Draft",
      am: "እንደ ረቂቅ አስቀምጥ",
    },
    selectDepartment: {
      en: "Select Department",
      am: "የመደብ ምረጥ",
    },
    selectEmployee: {
      en: "Select Employee",
      am: "ሰራተኛ ምረጥ",
    },
    noRecipientsTitle: {
      en: "No Recipients Available",
      am: "ተቀባዮች አልተገኙም",
    },
    noRecipientsDescription: {
      en:
        "You don't have any colleagues in your sub-sub-category or a sub-sub-category head to send letters to. This might be because you're the only user in your department or your department structure needs to be updated.",
      am:
        "በንዑስ ንዑስ ምድብዎ ውስጥ ማንኛውንም ባልስራች ወይም የንዑስ ንዑስ ምድብ ኃላፊ ለመላክ አልተገኙም። ይህ ምናልባት በዚህ መደብ ውስጥ ብቻዎት ስለሆኑ ወይም የመደብዎ አዋቂ መዋቅር ማዘመን ያስፈልጋል።",
    },
    noRecipientsOtherRole: {
      en:
        "Based on your role ({role}), you don't have permission to send letters to any users in the system.",
      am:
        "በሚናዎ ({role}) መሰረት ለማንኛውም ተጠቃሚ ደብዳቤ ለመላክ ፈቃድ የለዎትም።",
    },
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setLetterData((prev: LetterData) => ({ ...prev, department: department }));
  }, [department]);

  useEffect(() => {
    setLetterData((prev: LetterData) => ({ ...prev, to: recipient }));
  }, [recipient]);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isHighPrivilege =
    currentUser.role === "director_general" ||
    currentUser.role === "deputy_director_general" ||
    currentUser.role === "executive_advisor" ||
    currentUser.role === "director_office" ||
    (typeof currentUser.role === "string" &&
      currentUser.role.endsWith("executive_head"));
  const isExecutiveHead = currentUser.role === "executive_head";
  const isDirectorOffice = currentUser.role === "director_office";
  const isRegularUser = currentUser.role === "user";

  // Debug: Log current user and all users for filtering
  console.log("Current user:", currentUser);
  console.log("All users:", users);
  // Show all users as possible recipients
  const allUsers = users;

  // Filter users based on selected department and role
  const filteredUsers = users.filter((user) => {
    // Build the department path to match
    const selectedPath = [
      selectedDepartmentSelection.main,
      selectedDepartmentSelection.sub,
      selectedDepartmentSelection.subSub,
    ]
      .filter(Boolean)
      .join(" > ")
      .trim();

    // Normalize for comparison
    const userDept = (user.departmentOrSector || "").trim();
    const pathMatches = selectedPath
      ? userDept.toLowerCase() === selectedPath.toLowerCase()
      : true;

    // If a role is selected, filter by role as well
    const roleMatches = selectedDepartmentSelection.role
      ? user.role === selectedDepartmentSelection.role
      : true;

    return pathMatches && roleMatches;
  });
  console.log("All users for recipient:", allUsers);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!letterData.content.trim()) {
      toast.error("Letter content is required.");
      return;
    }

    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) {
      toast.error("User not logged in. Please log in again.");
      return;
    }

    // Debug: Log CC data before sending
    console.log("CC Employees data before sending:", letterData.ccEmployees);
    console.log(
      "Total CC recipients:",
      Object.values(letterData.ccEmployees).reduce(
        (total, employees) => total + (employees?.length || 0),
        0
      )
    );

    setSending(true);
    try {
      let response;

      if (attachment) {
        const formData = new FormData();
        Object.entries(letterData).forEach(([key, value]) => {
          if (key === "ccEmployees") {
            formData.append("ccEmployees", JSON.stringify(value));
            console.log("Adding CC data to FormData:", JSON.stringify(value));
          } else if (key !== "attachments" && key !== "from") {
            formData.append(key, value as string);
          }
        });
        formData.append("from", currentUserId);
        formData.append("attachment", attachment);

        console.log("FormData before sending:", Array.from(formData.entries()));

        response = await axios.post(
          "http://localhost:5000/api/letters",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        const requestData = {
          ...letterData,
          from: currentUserId,
          ccEmployees: JSON.stringify(letterData.ccEmployees),
        };
        console.log("Sending request data:", requestData);

        response = await axios.post(
          "http://localhost:5000/api/letters",
          requestData
        );
      }

      console.log("Letter sent successfully with response:", response.data);

      setLetterData({
        subject: "",
        to: "",
        department: "",
        priority: "normal",
        content: "",
        attachments: [],
        cc: [],
        ccEmployees: {},
        from: "",
      });
      setDepartment("");
      setRecipient("");
      setAttachment(null);

      // Check if the letter is pending approval (high/urgent priority)
      const isHighPriority = ["high", "urgent"].includes(letterData.priority);
      if (isHighPriority) {
        toast.success(
          `High priority letter submitted successfully! It is now pending admin approval and will be sent once approved.`,
          { autoClose: 5000 }
        );
      } else {
        toast.success("Letter sent successfully!");
      }

      if (refresh) refresh(); // Force Sent page to refresh
      reset();
      // Force refresh users and departments
      fetchUsers();
      fetchDepartments();
      // Collapse department dropdowns
      departmentSelectorRef.current?.reset();
    } catch (error: any) {
      console.error("Error details:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to send the letter. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      setLetterData((prev: LetterData) => ({
        ...prev,
        attachments: [file.name],
      }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachment(e.dataTransfer.files[0]);
      setLetterData((prev: LetterData) => ({
        ...prev,
        attachments: [e.dataTransfer.files[0].name],
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setLetterData((prev: LetterData) => ({
      ...prev,
      attachments: [],
    }));
  };

  // Find the selected recipient's user object
  const selectedRecipient = users.find((u) => u.name === letterData.to);
  const recipientDepartment =
    selectedRecipient && selectedRecipient.departmentOrSector
      ? selectedRecipient.departmentOrSector
      : "";

  // Build the CC string from selected categories only (departments/categories, not user names)
  const ccString = letterData.cc.length > 0 ? letterData.cc.join(", ") : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003F5D] via-[#BFBFBF] to-[#C88B3D] flex items-center justify-center py-10 px-2">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-[#BFBFBF] p-8 relative">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-block p-3 rounded-full bg-gradient-to-tr from-[#003F5D] via-[#C88B3D] to-[#BFBFBF] shadow-lg">
              <SendIcon className="text-white text-3xl" />
            </span>
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#003F5D] via-[#C88B3D] to-[#BFBFBF] drop-shadow-lg">
              {t.title[lang]}
            </h2>
          </div>
          <p className="text-lg text-[#003F5D] font-medium text-center">
            {t.subtitle[lang]}
          </p>
        </div>

        <div className="divide-y divide-[#BFBFBF]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Department */}
            <div className="pt-2">
              <label
                htmlFor="department"
                className="block text-sm font-bold text-[#003F5D] mb-1"
              >
                {t.department[lang]}
              </label>
              <DepartmentSelector
                ref={departmentSelectorRef}
                onChange={(selection) => {
                  setDepartment(selection.fullPath);
                  setSelectedDepartmentSelection(selection);
                }}
              />
            </div>
            {/* Recipient */}
            <div className="pt-6">
              <label className="block text-sm font-bold text-[#003F5D] mb-1">
                {t.to[lang]}
              </label>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-[#BFBFBF] rounded-lg focus:ring-2 focus:ring-[#C88B3D] focus:border-[#C88B3D] transition-all placeholder-[#BFBFBF] hover:border-[#C88B3D] bg-[#F8F8F8]"
                placeholder={t.selectEmployee[lang]}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                list="user-list"
                autoComplete="off"
                disabled={loadingUsers}
              />
              <datalist id="user-list">
                {filteredUsers.map((user) => (
                  <option key={user._id} value={user.name}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </datalist>
              {loadingUsers && (
                <LoadingSpinner message="Loading employees..." />
              )}

              {/* No recipient restrictions or warnings */}
            </div>

            {/* Subject */}
            <div className="pt-6">
              <label className="block text-sm font-bold text-[#003F5D] mb-1">
                {t.subject[lang]}
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-[#BFBFBF] rounded-lg focus:ring-2 focus:ring-[#C88B3D] focus:border-[#C88B3D] transition-all placeholder-[#BFBFBF] hover:border-[#C88B3D] bg-[#F8F8F8]"
                placeholder={
                  lang === "am" ? "ርዕሱን ያስገቡ" : "Enter letter subject"
                }
                value={letterData.subject}
                onChange={(e) =>
                  setLetterData({ ...letterData, subject: e.target.value })
                }
              />
            </div>

            {/* Priority */}
            <div className="pt-6">
              <label className="block text-sm font-bold text-[#003F5D] mb-1">
                {t.priority[lang]}
              </label>
              <div className="flex space-x-4">
                {["normal", "high", "urgent"].map((priority) => (
                  <label
                    key={priority}
                    className={`inline-flex items-center cursor-pointer transition-all px-3 py-1 rounded-lg border-2 ${
                      letterData.priority === priority
                        ? "border-[#C88B3D] bg-[#FFF7E6] text-[#C88B3D] font-bold"
                        : "border-[#BFBFBF] text-[#003F5D] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      className="form-radio text-[#C88B3D] focus:ring-2 focus:ring-[#C88B3D]"
                      name="priority"
                      value={priority}
                      checked={letterData.priority === priority}
                      onChange={(e) =>
                        setLetterData({
                          ...letterData,
                          priority: e.target.value,
                        })
                      }
                    />
                    <span className="ml-2 text-sm capitalize">
                      {lang === "am"
                        ? priority === "normal"
                          ? "መደበኛ"
                          : priority === "high"
                          ? "ከፍተኛ"
                          : "አስቸኳይ"
                        : priority}
                    </span>
                  </label>
                ))}
              </div>

              {/* Admin Approval Notice for High/Urgent Priority */}
              {["high", "urgent"].includes(letterData.priority) && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 text-lg">⏳</span>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Admin Approval Required
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {letterData.priority === "urgent"
                          ? "Urgent priority letters require admin approval before being sent. This ensures proper oversight of time-sensitive communications."
                          : "High priority letters require admin approval before being sent. This ensures proper oversight of important communications."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="pt-6">
              <label className="block text-sm font-bold text-[#003F5D] mb-1">
                {t.content[lang]}
              </label>
              <TemplateMemoLetter
                subject={letterData.subject}
                recipient={letterData.to}
                recipientDepartment={recipientDepartment}
                cc={ccString}
                reference={""}
                body={
                  <textarea
                    value={letterData.content}
                    onChange={(e) =>
                      setLetterData({ ...letterData, content: e.target.value })
                    }
                    placeholder={
                      lang === "am"
                        ? "የደብዳቤውን ይዘት ያስገቡ"
                        : "Enter letter content"
                    }
                    className="w-full min-h-[180px] text-base outline-none border-none bg-transparent resize-vertical focus:ring-2 focus:ring-[#C88B3D] transition-all"
                    style={{
                      fontFamily: "'Noto Sans Ethiopic', Arial, sans-serif",
                      lineHeight: 1.8,
                      color: "#003F5D",
                    }}
                  />
                }
                senderName={currentUser.name || currentUser.username || currentUser.email || ""}
                senderDepartment={
                  (currentUser.department || currentUser.departmentOrSector || "")
                    .split('>')
                    .pop()
                    .trim()
                }
                senderSignature={
                  currentUser.signatureImage
                    ? (currentUser.signatureImage.startsWith('http')
                        ? currentUser.signatureImage
                        : `http://localhost:5000/${currentUser.signatureImage}`)
                    : null
                }
              />
            </div>

            {/* Attachments */}
            <div className="pt-6">
              <label className="block text-sm font-bold text-[#003F5D] mb-1">
                {t.attachments[lang]}
              </label>
              <div
                className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#BFBFBF] border-dashed rounded-lg transition-colors ${
                  dragActive ? "border-[#C88B3D] bg-[#FFF7E6]" : ""
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="space-y-1 text-center">
                  <PaperclipIcon className="mx-auto h-10 w-10 text-[#003F5D]" />
                  <div className="flex text-sm text-[#003F5D] justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-[#C88B3D] hover:text-[#003F5D] focus:ring-2 focus:ring-[#C88B3D] transition-all"
                    >
                      <span>{t.upload[lang]}</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">{t.orDrag[lang]}</p>
                  </div>
                  <p className="text-xs text-[#BFBFBF]">{t.uploadHint[lang]}</p>
                  {attachment && (
                    <div className="mt-2 flex items-center justify-center space-x-2">
                      <span className="text-green-600 font-medium">
                        {attachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="text-red-500 hover:underline text-xs focus:ring-2 focus:ring-red-400 transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CC Section */}
            <div className="pt-6">
              <CCSection
                letterData={letterData}
                setLetterData={setLetterData}
              />
            </div>

            {/* Submit and Save */}
            <div className="flex justify-between mt-8">
              <button
                type="submit"
                className={`bg-[#003F5D] text-white rounded-lg px-6 py-3 flex items-center space-x-2 focus:ring-2 focus:ring-[#C88B3D] transition-all text-lg font-bold shadow-lg ${
                  sending
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-[#C88B3D] hover:text-[#003F5D]"
                }`}
                disabled={sending}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block align-middle">
                      <LoadingSpinner
                        message=""
                        iconClassName="!text-xl !w-5 !h-5"
                      />
                    </span>
                    <span className="text-base font-semibold">
                      {["high", "urgent"].includes(letterData.priority)
                        ? "Submitting..."
                        : "Sending..."}
                    </span>
                  </span>
                ) : (
                  <>
                    <SendIcon className="w-5 h-5" />
                    <span>
                      {["high", "urgent"].includes(letterData.priority)
                        ? "Submit for Approval"
                        : t.send[lang]}
                    </span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="bg-[#BFBFBF] text-[#003F5D] rounded-lg px-6 py-3 flex items-center space-x-2 hover:bg-[#C88B3D] hover:text-white focus:ring-2 focus:ring-[#C88B3D] transition-all text-lg font-bold shadow-lg"
              >
                <SaveIcon className="w-5 h-5" />
                <span>{t.saveDraft[lang]}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewLetter;
