import React from "react";
import {
  CheckCircleIcon,
  FileTextIcon,
  MailIcon,
  UserIcon,
  AlertCircleIcon,
  ClockIcon,
} from "lucide-react";
import { useLanguage } from '../pages/LanguageContext';
import { useInbox } from '../../context/InboxContext';
import { useSent } from '../../context/SentContext';

const getActivityIcon = (letter: any, userEmail: string) => {
  if (letter.priority === 'urgent') return <AlertCircleIcon className="w-4 h-4 text-red-500 bg-red-50 p-1 rounded-full" />;
  if (letter.fromEmail === userEmail) return <MailIcon className="w-4 h-4 text-blue-500 bg-blue-50 p-1 rounded-full" />;
  return <FileTextIcon className="w-4 h-4 text-green-500 bg-green-50 p-1 rounded-full" />;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
};

export const ActivityTimeline = () => {
  const { t } = useLanguage();
  const { letters: inboxLetters } = useInbox();
  const { letters: sentLetters } = useSent();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email || "";

  // Merge and sort all letters by date (sent + received)
  const allLetters = [...inboxLetters, ...sentLetters]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg border border-gray-200 transition-transform duration-200 hover:shadow-lg hover:scale-[1.03]">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{t.dashboard.recentActivity}</h3>
      </div>
      <div className="p-6">
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute top-0 left-4 bottom-0 w-0.5 bg-gray-200"
            style={{ left: "19px" }}
          ></div>
          {/* Activity items */}
          <div className="space-y-6">
            {allLetters.map((letter, idx) => (
              <div key={letter._id} className="relative flex items-start ml-6">
                <div className="absolute -left-10 mt-1">
                  {getActivityIcon(letter, userEmail)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">
                    {letter.subject}
                  </h4>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {letter.fromEmail === userEmail
                      ? `Sent to ${letter.toEmail || letter.toName || letter.department}`
                      : `Received from ${letter.fromName || letter.fromEmail}`}
                  </p>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {formatDate(letter.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
