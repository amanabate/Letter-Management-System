import React, { useState, useEffect } from 'react';
import { ArchiveIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import axios from 'axios';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';

const Archive = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [archivedReceived, setArchivedReceived] = useState<any[]>([]);
  const [archivedSent, setArchivedSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [restoring, setRestoring] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchArchived = async () => {
      setLoading(true);
      try {
        // Fetch all received letters
        const inboxRes = await axios.get('http://localhost:5000/api/letters', {
          params: { userEmail: user.email }
        });
        setArchivedReceived(inboxRes.data.filter((l: any) => l.archived));
        // Fetch all sent letters
        const sentRes = await axios.get('http://localhost:5000/api/letters/sent', {
          params: { userEmail: user.email }
        });
        setArchivedSent(sentRes.data.filter((l: any) => l.archived));
      } catch (err) {
        setArchivedReceived([]);
        setArchivedSent([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, [user.email]);

  const handleRestore = async () => {
    if (!selectedLetter) return;
    setRestoring(true);
    try {
      await axios.post('http://localhost:5000/api/letters/status', {
        letterId: selectedLetter._id,
        archived: false,
      });
      if (activeTab === 'received') {
        setArchivedReceived((prev) => prev.filter((l) => l._id !== selectedLetter._id));
      } else {
        setArchivedSent((prev) => prev.filter((l) => l._id !== selectedLetter._id));
      }
      setRestoreModalOpen(false);
    } catch (err) {
      // Optionally show error
    } finally {
      setRestoring(false);
      setSelectedLetter(null);
    }
  };

  const renderLetter = (letter: any) => (
    <div key={letter._id} className="bg-gray-50 rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200">
      <div className="flex-1 text-left">
        <div className="font-semibold text-lg text-gray-800">{letter.subject}</div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="mr-4"><b>{t.letterManagement.from}:</b> {letter.fromName || letter.fromEmail}</span>
          <span className="mr-4"><b>{t.letterManagement.to}:</b> {letter.to || letter.toEmail}</span>
          <span className="mr-4"><b>{t.letterManagement.date}:</b> {new Date(letter.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">{letter.department}</div>
      </div>
      <div className="flex flex-col gap-2 mt-4 md:mt-0 md:ml-6">
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow"
          onClick={() => { setSelectedLetter(letter); setRestoreModalOpen(true); }}
        >
          {t.archive.restoreButton || 'Restore'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text drop-shadow-md">{t.archive.title}</h2>
          <p className="text-lg text-[#BFBFBF] font-medium">{t.archive.manageArchivedLetters}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-3 text-lg font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'received' ? 'border-b-4 border-blue-600 text-blue-700 bg-gray-50' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('received')}
            >
              {'Received Letters'}
            </button>
            <button
              className={`flex-1 py-3 text-lg font-semibold focus:outline-none transition-colors duration-150 ${activeTab === 'sent' ? 'border-b-4 border-blue-600 text-blue-700 bg-gray-50' : 'text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('sent')}
            >
              {'Sent Letters'}
            </button>
          </div>
          {/* Search/Filter */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="relative">
                <input type="text" placeholder={t.archive.searchPlaceholder} className="w-64 pl-9 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-md">
                <FilterIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center text-gray-400">Loading...</div>
            ) : activeTab === 'received' ? (
              archivedReceived.length === 0 ? (
                <div className="text-center text-gray-500">
                  <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">{'No archived received letters.'}</p>
                </div>
              ) : (
                archivedReceived.map(renderLetter)
              )
            ) : (
              archivedSent.length === 0 ? (
                <div className="text-center text-gray-500">
            <ArchiveIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">{'No archived sent letters.'}</p>
                </div>
              ) : (
                archivedSent.map(renderLetter)
              )
            )}
          </div>
        </div>
      </div>
      <Modal
        open={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        center
        classNames={{ modal: 'max-w-md w-full mx-4' }}
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">Are you sure you want to restore this letter? It will return to its original section.</p>
          <div className="flex justify-end gap-2">
            <button
              className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setRestoreModalOpen(false)}
              disabled={restoring}
            >
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Archive;