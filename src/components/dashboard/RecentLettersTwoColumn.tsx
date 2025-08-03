import React from "react";
import {
  FileTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CopyIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from '../pages/LanguageContext';
import { useInbox } from '../../context/InboxContext';
import { useSent } from '../../context/SentContext';

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

export const RecentLettersTwoColumn = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { letters: inboxLetters, loadingLetters: loadingInbox } = useInbox();
  const { letters: sentLetters, loading: loadingSent } = useSent();
  
  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userEmail = user.email;

  // Get 5 most recent sent letters (filtered by current user)
  const recentSentLetters = sentLetters
    .filter(letter => letter.fromEmail === userEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get 5 most recent received letters (filtered by current user)
  const recentReceivedLetters = inboxLetters
    .filter(letter => letter.toEmail === userEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get 5 most recent carbon copy letters (filtered by current user)
  const recentCarbonCopyLetters = inboxLetters
    .filter(letter => letter.isCC && letter.toEmail === userEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const loading = loadingInbox || loadingSent;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-6">
            {[1, 2].map((col) => (
              <div key={col} className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 transition-transform duration-200 hover:shadow-lg hover:scale-[1.02]">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 text-center">
          Recent Letters
        </h3>
      </div>
             <div className="grid grid-cols-3 divide-x divide-gray-200">
        {/* Sent Letters Column */}
        <div className="p-4">
          <div className="flex items-center justify-center mb-4">
            <ArrowUpIcon className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">
              Sent Letters
            </h4>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
                         {recentSentLetters.length > 0 ? (
               recentSentLetters.map((letter) => (
                 <div
                   key={letter._id}
                   className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                   onClick={() => navigate(`/sent/${letter._id}`)}
                 >
                   <div className="flex items-start space-x-3">
                     <div className="p-1.5 bg-green-100 rounded">
                       <FileTextIcon className="w-4 h-4 text-green-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-sm font-medium text-gray-800 truncate">
                         {letter.subject}
                       </h5>
                       <p className="text-xs text-gray-500 mt-1">
                         {formatDate(letter.createdAt)}
                       </p>
                     </div>
                   </div>
                 </div>
               ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No sent letters yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Received Letters Column */}
        <div className="p-4">
          <div className="flex items-center justify-center mb-4">
            <ArrowDownIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-700">
              Received Letters
            </h4>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
                         {recentReceivedLetters.length > 0 ? (
               recentReceivedLetters.map((letter) => (
                 <div
                   key={letter._id}
                   className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                   onClick={() => navigate(`/inbox/${letter._id}`)}
                 >
                   <div className="flex items-start space-x-3">
                     <div className="p-1.5 bg-blue-100 rounded">
                       <FileTextIcon className="w-4 h-4 text-blue-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-sm font-medium text-gray-800 truncate">
                         {letter.subject}
                       </h5>
                       <p className="text-xs text-gray-500 mt-1">
                         {formatDate(letter.createdAt)}
                       </p>
                     </div>
                   </div>
                 </div>
               ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No received letters yet</p>
              </div>
            )}
          </div>
                 </div>

         {/* Carbon Copy Letters Column */}
         <div className="p-4">
           <div className="flex items-center justify-center mb-4">
             <CopyIcon className="w-5 h-5 text-purple-600 mr-2" />
             <h4 className="text-sm font-semibold text-gray-700">
               Carbon Copy
             </h4>
           </div>
           <div className="space-y-3 max-h-64 overflow-y-auto">
             {recentCarbonCopyLetters.length > 0 ? (
               recentCarbonCopyLetters.map((letter) => (
                 <div
                   key={letter._id}
                   className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                   onClick={() => navigate(`/inbox/${letter._id}`)}
                 >
                   <div className="flex items-start space-x-3">
                     <div className="p-1.5 bg-purple-100 rounded">
                       <FileTextIcon className="w-4 h-4 text-purple-600" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <h5 className="text-sm font-medium text-gray-800 truncate">
                         {letter.subject}
                       </h5>
                       <p className="text-xs text-gray-500 mt-1">
                         {formatDate(letter.createdAt)}
                       </p>
                     </div>
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-4">
                 <p className="text-sm text-gray-500">No carbon copy letters yet</p>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   );
 }; 