import React from "react";
import { MailOutlined } from "@ant-design/icons";
import { useLanguage } from "../../components/pages/LanguageContext";

interface LoadingSpinnerProps {
  message?: string;
  iconClassName?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  iconClassName,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full">
      <div className="relative mb-4">
        <span className="inline-block p-6 rounded-full bg-gradient-to-tr from-[#003F5D] via-[#C88B3D] to-[#BFBFBF] animate-pulse shadow-2xl">
          <MailOutlined
            className={
              iconClassName
                ? iconClassName + " text-[#FFFFFF] animate-bounce"
                : "text-[#FFFFFF] text-5xl animate-bounce"
            }
          />
        </span>
        <span className="absolute -top-2 -right-2 bg-[#C88B3D] text-[#003F5D] text-xs px-2 py-1 rounded-full shadow-lg animate-ping opacity-70">
          !
        </span>
      </div>
      <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#003F5D] via-[#C88B3D] to-[#BFBFBF] mb-2 animate-pulse">
        {message || t.loading.letters}
      </div>
      <div className="text-[#BFBFBF] text-sm italic">
        {t.loading.pleaseWait}
      </div>
    </div>
  );
};

export default LoadingSpinner;
