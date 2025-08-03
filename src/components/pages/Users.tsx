import React from 'react';
import { UsersIcon, SearchIcon } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Users = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md">{t.users.title}</h2>
          <p className="text-lg text-[#BFBFBF] font-medium">{t.users.manageUsers}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input type="text" placeholder={t.users.searchPlaceholder} className="w-64 pl-9 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6 text-center text-gray-500">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">{t.users.noUsersFound}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Users;