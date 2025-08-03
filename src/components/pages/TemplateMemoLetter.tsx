import React, { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import { EthDateTime } from "ethiopian-calendar-date-converter";

// Example departments (replace with API call if needed)

const getFormattedUTCDate = () => {
  const now = new Date();
  const day = String(now.getUTCDate()).padStart(2, "0");
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const year = now.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const iconStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: "50%",
  background: "#b07642",
  color: "white",
  fontSize: 18,
  margin: "0 auto",
  zIndex: 2,
  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
};

const TemplateMemoLetter = ({
  subject,
  date,
  recipient,
  recipientDepartment,
  reference,
  body,
  signature,
  cc = "",
  copyTo,
  senderName,
  senderDepartment,
  senderSignature,
  children,
}: {
  subject?: string;
  date?: string;
  recipient?: string;
  recipientDepartment?: string;
  reference?: string;
  body?: React.ReactNode;
  signature?: React.ReactNode;
  cc?: React.ReactNode;
  copyTo?: React.ReactNode;
  senderName?: string;
  senderDepartment?: string;
  senderSignature?: string | null;
  children?: React.ReactNode;
}) => {
  const [userName, setUserName] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const { t, lang } = useLanguage();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserName(
      user.name && user.name !== "undefined"
        ? user.name
        : user.username && user.username !== "undefined"
        ? user.username
        : user.email && user.email !== "undefined"
        ? user.email
        : ""
    );
    setUserDepartment(
      user.department && user.department !== "undefined" ? user.department : ""
    );
    setSelectedDepartment(
      user.department && user.department !== "undefined" ? user.department : ""
    );
  }, []);

  // Helper to get Ethiopian date string
  const getEthiopianDate = (dateStr?: string) => {
    const dateObj = dateStr ? new Date(dateStr) : new Date();
    const ethDate = EthDateTime.fromEuropeanDate(dateObj);
    // Format: DD/MM/YYYY (Ethiopian)
    return `${String(ethDate.date).padStart(2, "0")}/${String(
      ethDate.month
    ).padStart(2, "0")}/${ethDate.year}`;
  };

  // Add a type guard for cc
  function isNonEmptyString(val: unknown): val is string {
    return typeof val === "string" && !!val && val.trim().length > 0;
  }

  return (
    <div
      className="bg-white w-full max-w-[850px] mx-auto shadow border border-gray-200 rounded-lg relative flex flex-col min-h-screen"
      style={{
        fontFamily: "'Noto Sans Ethiopic', Arial, sans-serif",
        background: "white",
      }}
    >
      {/* HEADER */}
      <div className="px-0 pt-4 pb-2 border-b-8 border-[#b07642]">
        <div className="flex flex-col items-center">
          {/* Bigger Logo at the top */}
          <img
            src="src/img icon/logo.png"
            alt="SSGI Logo"
            className="h-20 sm:h-24 md:h-28 mb-2"
            style={{ objectFit: "contain", maxWidth: 120 }}
          />
          <div className="text-[#03619c] font-bold leading-tight text-[15px] xs:text-[16px] sm:text-lg md:text-xl lg:text-2xl text-center">
            የስፔስ ሳይንስ እና ጂኦስፓሻል ኢንስቲትዩት
          </div>
          <div className="font-bold text-black tracking-wide text-[15px] xs:text-[16px] sm:text-lg md:text-xl lg:text-2xl mb-2 text-center">
            SPACE SCIENCE AND GEOSPATIAL INSTITUTE
          </div>
        </div>
        <div className="h-2 w-full mt-3 mb-0 flex items-center gap-[2px] px-2 sm:px-8">
          <div className="h-2 w-1/2 bg-[#03619c] rounded-l-full" />
          <div className="h-2 w-1/4 bg-[#b07642]" />
          <div className="h-2 w-1/4 bg-[#f05323] rounded-r-full" />
        </div>
      </div>

      {/* MEMO TITLE & DATE */}
      <div className="flex flex-row justify-between items-center px-2 xs:px-4 sm:px-8 mt-3 mb-2">
        <div />
        <div className="text-center flex flex-col items-center">
          <div className="text-[#03619c] font-bold text-[15px] xs:text-[16px] sm:text-lg md:text-xl lg:text-2xl leading-tight">
            የዉስጥ ማስታወሻ
          </div>
          <div className="font-bold text-black tracking-wide text-[15px] xs:text-[16px] sm:text-lg md:text-xl lg:text-2xl mb-2 text-center">
            OFFICE MEMO
          </div>
        </div>
        <div className="text-right text-[#03619c] text-[13px] xs:text-[14px] sm:text-base md:text-lg">
          <div>
            <span className="inline-block align-middle mr-1" title="Date">
              <svg
                width="15"
                height="15"
                fill="#03619c"
                viewBox="0 0 24 24"
                style={{ display: "inline" }}
              >
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z" />
              </svg>
            </span>
            {lang === "am"
              ? getEthiopianDate(date)
              : (date ? new Date(date).toLocaleString() : getFormattedUTCDate())}
          </div>
          <div className="text-[11px] sm:text-xs md:text-sm text-gray-600">
            {t.memo.date}
          </div>
        </div>
      </div>

      {/* TO RECIPIENT (just like subject) */}
      {recipient && (
        <div className="px-2 xs:px-4 sm:px-8 pb-2">
          <div className="font-semibold text-lg">
            <span className="text-gray-600">To: </span>
            <span className="text-gray-900">{recipient}</span>
          </div>
          {recipientDepartment && (
            <div className="text-sm text-gray-500 mt-1 ml-2">
              {typeof recipientDepartment === 'string' ? recipientDepartment.split(">")?.pop()?.trim() : ''}
            </div>
          )}
        </div>
      )}

      {/* SUB-SUB CATEGORY (DEPARTMENT) LABEL */}
      {/* {recipientDepartment && recipientDepartment.split(">").length === 3 && (
        <div className="px-2 xs:px-4 sm:px-8 mt-2 mb-2">
          <div className="inline-block bg-[#e6f0fa] text-[#03619c] font-semibold rounded-full px-4 py-1 text-sm shadow">
            {recipientDepartment}
          </div>
        </div>
      )} */}

      {/* SUBJECT LABEL */}
      <div className="px-2 xs:px-4 sm:px-8 mt-2 mb-1">
        <div className="font-semibold text-lg">
          <span className="text-gray-600">{t.memo.subject}: </span>
          <span className="text-gray-900">{subject}</span>
        </div>
      </div>

      {/* LETTER BODY */}
      <div className="flex-1 px-2 xs:px-4 sm:px-8 pt-2 pb-0 min-h-[200px]">
        {reference && (
          <div className="mb-2 text-[13px] xs:text-sm sm:text-base md:text-lg font-semibold">{`ቁጥር ${reference}`}</div>
        )}
        <div
          className="mb-8 text-[14px] xs:text-[15px] sm:text-base md:text-lg text-gray-700"
          style={{ lineHeight: 1.85 }}
        >
          {body || children || (
            <span className="text-gray-400">Enter letter content</span>
          )}
        </div>
        {/* Signature Block */}
        <div className="mt-12 flex flex-col items-center w-full">
          <div className="text-[#003F5D] font-bold mb-1">Signature</div>
          <div className="text-[#003F5D] font-semibold">{senderName}</div>
          <div className="text-[#003F5D] text-sm mb-1">{senderDepartment}</div>
          {senderSignature && (
            <div style={{ position: 'relative', width: 220, height: 110 }}>
              <img 
                src={senderSignature} 
                alt="Sender Signature" 
                style={{ 
                  maxWidth: 200, 
                  maxHeight: 100, 
                  background: 'none', 
                  border: 'none', 
                  position: 'absolute', 
                  right: -35, 
                  top: -2 
                }} 
              />
            </div>
          )}
        </div>
      </div>

      {/* CC SECTION (below content, line by line) */}
      {isNonEmptyString(cc) && (
        <div className="px-2 xs:px-4 sm:px-8 mb-2 mt-2">
          <div className="text-sm font-medium text-gray-700 mb-1">CC:</div>
          <div className="text-base text-gray-800 whitespace-pre-line">
            {cc.split(",").map((item, idx) => (
              <div key={idx}>{item.trim()}</div>
            ))}
          </div>
        </div>
      )}

      {/* SIGNATURE */}
      <div className="flex justify-between items-center mx">
        {signature && (
          <div className="px-2 xs:px-4 sm:px-8 pb-2">
            <div className="text-sm font-medium text-gray-700 mt-8">
              Signature:
            </div>
            <div className="text-base text-gray-800">{signature}</div>
          </div>
        )}
      </div>

      {/* CC / CopyTo */}
      {copyTo && (
        <div className="px-2 xs:px-4 sm:px-8 pb-2">
          <div className="text-sm font-medium text-gray-700">Copy To:</div>
          <div className="text-base text-gray-800">{copyTo}</div>
        </div>
      )}

      {children}

      {/* FOOTER */}
      <div className="w-full pt-2">
        <div
          className="w-full flex flex-col items-center"
          style={{ borderTop: "4px solid #194b5a" }}
        >
          <div
            className={`
            flex w-full flex-row flex-wrap justify-between
            px-0
            mt-[-18px] z-20
            gap-y-1
            xs:gap-y-1
            xs:px-2
            sm:px-6
            xs:mt-[-14px]
            sm:mt-[-18px]
            [@media(max-width:410px)]:gap-x-1
            [@media(max-width:410px)]:px-1
            [@media(max-width:410px)]:mt-[-8px]
            [@media(max-width:375px)]:mt-[-4px]
            [@media(max-width:370px)]:gap-x-0
            [@media(max-width:370px)]:px-0
            [@media(max-width:370px)]:mt-[-2px]
          `}
          >
            {/* Phone */}
            <div className="flex flex-col items-center w-1/5 min-w-[46px] mb-2">
              <span
                style={{
                  ...iconStyle,
                  width: 32,
                  height: 32,
                  fontSize: 14,
                  // Larger on desktop
                  ...(typeof window !== "undefined" && window.innerWidth >= 1024
                    ? { width: 40, height: 50, fontSize: 24 }
                    : {}),
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21 11.36 11.36 0 003.54.57 1 1 0 011 1v3.61a1 1 0 01-1 1A17 17 0 013 5a1 1 0 011-1h3.61a1 1 0 011 1 11.36 11.36 0 00.57 3.54 1 1 0 01-.21 1.11l-2.2 2.2z" />
                </svg>
              </span>
              <div
                className="text-[12px] xs:text-xs sm:text-base md:text-lg text-[#194b5a] leading-tight mt-1 text-center"
                style={{ fontFamily: "inherit" }}
              >
                +251 118 96 10 50
                <br />
                +251 115 51 84 45
              </div>
            </div>
            {/* Website */}
            <div className="flex flex-col items-center w-1/5 min-w-[46px] mb-2">
              <span
                style={{
                  ...iconStyle,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  ...(typeof window !== "undefined" && window.innerWidth >= 1024
                    ? { width: 40, height: 40, fontSize: 24 }
                    : {}),
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M2 12h20M12 2c3.866 0 7 4.03 7 9s-3.134 9-7 9-7-4.03-7-9 3.134-9 7-9z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              <a
                href="http://www.ssgi.gov.et"
                className="text-[#194b5a] underline text-[12px] xs:text-xs sm:text-base md:text-lg mt-1 text-center"
                style={{ fontFamily: "inherit" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                www.ssgi.gov.et
              </a>
            </div>
            {/* Mail/PO Box */}
            <div className="flex flex-col items-center w-1/5 min-w-[46px] mb-2">
              <span
                style={{
                  ...iconStyle,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  ...(typeof window !== "undefined" && window.innerWidth >= 1024
                    ? { width: 40, height: 40, fontSize: 24 }
                    : {}),
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <rect
                    width="18"
                    height="14"
                    x="3"
                    y="5"
                    rx="2"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <polyline
                    points="3 7 12 13 21 7"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span
                className="text-[#194b5a] text-[12px] xs:text-xs sm:text-base md:text-lg mt-1 text-center"
                style={{ fontFamily: "inherit" }}
              >
                33679 / 597
              </span>
            </div>
            {/* Email */}
            <div className="flex flex-col items-center w-1/5 min-w-[46px] mb-2">
              <span
                style={{
                  ...iconStyle,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  ...(typeof window !== "undefined" && window.innerWidth >= 1024
                    ? { width: 40, height: 40, fontSize: 24 }
                    : {}),
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M8 12l2 2l4-4"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              <a
                href="mailto:info@ssgi.gov.et"
                className="text-[#194b5a] underline text-[12px] xs:text-xs sm:text-base md:text-lg mt-1 text-center"
                style={{ fontFamily: "inherit" }}
              >
                info@ssgi.gov.et
              </a>
            </div>
            {/* Fax */}
            <div className="flex flex-col items-center w-1/5 min-w-[46px] mb-2">
              <span
                style={{
                  ...iconStyle,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  ...(typeof window !== "undefined" && window.innerWidth >= 1024
                    ? { width: 40, height: 40, fontSize: 24 }
                    : {}),
                }}
              >
                <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
                  <path
                    d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </span>
              <span
                className="text-[#194b5a] text-[12px] xs:text-xs sm:text-base md:text-lg mt-1 text-center"
                style={{ fontFamily: "inherit" }}
              >
                +251 118 96 10 51
              </span>
            </div>
          </div>
          <div
            className="text-center text-[#b07642] text-[13px] xs:text-sm sm:text-base md:text-lg mt-1 mb-0"
            style={{ fontFamily: "'Noto Sans Ethiopic', Arial, sans-serif" }}
          >
            "ከምድር እስከ ህዋ..."
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateMemoLetter;
