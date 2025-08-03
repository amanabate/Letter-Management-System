import React, {
  useEffect,
  useState,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import axios from "axios";
import { Edit, Trash2, Save, X, Search, Loader2, CheckCircle2, Star } from "lucide-react";
import DepartmentSelector from "./DepartmentSelector";
import LoadingSpinner from "../common/LoadingSpinner";
import { useLanguage } from "../../components/pages/LanguageContext";

interface User {
  _id: string;
  name: string;
  email: string;
  departmentOrSector: string;
  phone?: string;
  profileImage?: string;
  active: boolean; // Added active property
}

// Debounce hook to optimize filtering on search
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface UserManagementProps {
  setSuccessMsg: Dispatch<SetStateAction<string>>;
}

const UserManagement: React.FC<UserManagementProps> = ({ setSuccessMsg }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [userSearch, setUserSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: string | null;
  }>({}); // { [userId]: 'edit'|'delete'|'save'|null }
  const [showActivateDialog, setShowActivateDialog] = useState<string | null>(null);

  const { t } = useLanguage();

  // Debounced search value for responsive filtering
  const debouncedSearch = useDebounce(userSearch, 200);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await axios.get("http://localhost:5000/api/users");
        setUsers(response.data);
      } catch (err) {
        setUsers([]);
      }
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  const handleDeleteUser = (id: string) => {
    setShowDeleteDialog(id);
  };

  const handleConfirmDeactivate = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "deactivate" }));
    try {
      await axios.patch(`http://localhost:5000/api/users/deactivate/${id}`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, active: false } : u));
      setSuccessMsg(t.userManagement?.userDeactivated || "User deactivated successfully!");
    } catch (err) {
      setSuccessMsg(t.userManagement?.deactivateFailed || "Failed to deactivate user. Please try again.");
    }
    setTimeout(() => setSuccessMsg(""), 2000);
    setShowDeleteDialog(null);
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  const handleActivateUser = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "activate" }));
    try {
      await axios.patch(`http://localhost:5000/api/users/activate/${id}`);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, active: true } : u));
      setSuccessMsg(t.userManagement?.userActivated || "User activated successfully!");
    } catch (err) {
      setSuccessMsg(t.userManagement?.activateFailed || "Failed to activate user. Please try again.");
    }
    setTimeout(() => setSuccessMsg(""), 2000);
    setShowActivateDialog(null);
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  const handleEditClick = (user: any) => {
    setEditingUserId(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      departmentOrSector: user.departmentOrSector,
      phone: user.phone || "",
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: "save" }));
    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${id}`,
        editForm
      );
      setUsers((prev) => prev.map((u) => (u._id === id ? response.data : u)));
      setSuccessMsg(t.userManagement?.userUpdated || "User updated!");
      setEditingUserId(null);
    } catch (err) {
      setSuccessMsg(t.userManagement?.updateFailed || "Failed to update user!");
    }
    setTimeout(() => setSuccessMsg(""), 2000);
    setActionLoading((prev) => ({ ...prev, [id]: null }));
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  // Memoized filtering for responsiveness
  const filteredUsers = useMemo(
    () =>
      users.filter((user: any) => {
        const matchesDepartment =
          !selectedDepartment || user.departmentOrSector === selectedDepartment;

        // Create a searchable string that includes all user fields
        const searchableString = [
          user.name,
          user.email,
          user.departmentOrSector,
          user.phone,
        ]
          .filter(Boolean)
          .join(" ");

        // Normalize both the search term and the searchable string
        const normalizedSearch = debouncedSearch.trim().toLowerCase();
        const normalizedString = searchableString.toLowerCase();

        // Check if the normalized search term is included in the normalized string
        const matchesSearch = normalizedString.includes(normalizedSearch);

        return matchesDepartment && matchesSearch;
      }),
    [users, debouncedSearch, selectedDepartment]
  );

  // Show breadcrumb only when not filtering
  const isFiltering = !!selectedDepartment || !!userSearch;

  return (
    <div className="w-full flex flex-col h-full">
      {/* Search and filter section - Fixed at top */}
      <div className="bg-white/80 backdrop-blur p-4 border-b rounded-t-2xl shadow-sm sticky top-0 z-10">
        <div className="flex flex-row items-center gap-4 mb-4">
          {/* Department Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <DepartmentSelector
              onChange={(selection) => setSelectedDepartment(selection.fullPath)}
              showBreadcrumb={!isFiltering}
              showSubDropdowns={true}
            />
          </div>
          {/* Search Bar */}
          <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 shadow-inner flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={t.userManagement?.searchPlaceholder || "Search users..."}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="ml-2 bg-transparent border-none outline-none w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* User Count */}
          <span className="text-gray-500 text-base font-medium whitespace-nowrap">
            {(t.userManagement?.userCount || "{count} users").replace("{count}", filteredUsers.length.toString())}
          </span>
        </div>
      </div>

      {/* User list section - Scrollable */}
      <div className="flex-1 overflow-y-auto px-2">
        {loadingUsers ? (
          <LoadingSpinner message="Loading users..." />
        ) : filteredUsers.length === 0 ? (
          <p className="text-gray-500">{t.userManagement?.noUsersFound || "No users found."}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className={`bg-white p-4 rounded-lg shadow flex flex-col justify-between min-h-[220px] ${user.active === false ? 'opacity-50 grayscale relative' : ''}`}
              >
                {editingUserId === user._id ? (
                  <div className="space-y-2 flex-1">
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Name"
                    />
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Email"
                    />
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Phone"
                    />
                    <input
                      type="text"
                      name="departmentOrSector"
                      value={editForm.departmentOrSector}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Department"
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleSaveEdit(user._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        disabled={actionLoading[user._id] === "save"}
                      >
                                {actionLoading[user._id] === "save" ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}{" "}
        {t.userManagement?.save || "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                        disabled={!!actionLoading[user._id]}
                      >
                        <X className="w-4 h-4" />
                        {t.userManagement?.cancel || "Cancel"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=E3F2FD&color=2563EB&size=48`}
                        alt={`${user.name}'s profile`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                      <h3 className="text-lg font-semibold text-gray-800">
                        {user.name === "Admin" ? t.userManagement?.admin || "Admin" : user.name}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600 inline-block mr-2">
                          {t.userManagement?.emailLabel || "Email:"}
                        </span>
                        <p className="text-gray-800 inline-block">
                          {user.email}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 inline-block mr-2">
                          {t.userManagement?.phoneLabel || "Phone:"}
                        </span>
                        <p className="text-gray-800 inline-block">
                          {user.phone || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 inline-block mr-2">
                          {t.userManagement?.departmentLabel || "Department:"}
                        </span>
                        <p className="text-gray-800 inline-block">
                          {user.departmentOrSector || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        disabled={!!actionLoading[user._id]}
                      >
                        <Edit className="w-4 h-4" />
                        {t.userManagement?.edit || "Edit"}
                      </button>
                      {user.active === false ? (
                        <button
                          onClick={() => setShowActivateDialog(user._id)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                          disabled={!!actionLoading[user._id]}
                        >
                          <Star className="w-4 h-4" />
                          {t.userManagement?.activate || "Activate"}
                        </button>
                      ) : (
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                        disabled={!!actionLoading[user._id]}
                      >
                        {/* Exact muted/deactivated icon from user image */}
                        <svg className="w-4 h-4" viewBox="0 0 277 289" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M138.5 20c-65.5 0-118.5 53-118.5 118.5s53 118.5 118.5 118.5 118.5-53 118.5-118.5S204 20 138.5 20zm0 215c-53.2 0-96.5-43.3-96.5-96.5S85.3 42 138.5 42 235 85.3 235 138.5 191.7 235 138.5 235zm-41.5-97.5h83v21h-83v-21zm41.5-41.5v83h-21v-83h21zm-97.5-41.5l195 195-15 15-195-195 15-15z"/></svg>
                        {t.userManagement?.deactivate || "Deactivate"}
                      </button>
                      )}
                    </div>
                  </div>
                )}
                {user.active === false && (
                  <span className="absolute top-2 right-2 bg-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{t.userManagement?.deactivatedLabel || 'Deactivated'}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-full p-2 mr-3">
                {/* Exact muted/deactivated icon from user image */}
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 277 289" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M138.5 20c-65.5 0-118.5 53-118.5 118.5s53 118.5 118.5 118.5 118.5-53 118.5-118.5S204 20 138.5 20zm0 215c-53.2 0-96.5-43.3-96.5-96.5S85.3 42 138.5 42 235 85.3 235 138.5 191.7 235 138.5 235zm-41.5-97.5h83v21h-83v-21zm41.5-41.5v83h-21v-83h21zm-97.5-41.5l195 195-15 15-195-195 15-15z"/></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t.userManagement?.deactivateUser || "Deactivate User"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t.userManagement?.deactivateConfirmation || "Are you sure you want to deactivate this user? This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {t.userManagement?.cancel || "Cancel"}
              </button>
              <button
                onClick={() => handleConfirmDeactivate(showDeleteDialog)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                disabled={actionLoading[showDeleteDialog] === "deactivate"}
              >
                {actionLoading[showDeleteDialog] === "deactivate" ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  // Exact muted/deactivated icon from user image
                  <svg className="w-4 h-4" viewBox="0 0 277 289" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M138.5 20c-65.5 0-118.5 53-118.5 118.5s53 118.5 118.5 118.5 118.5-53 118.5-118.5S204 20 138.5 20zm0 215c-53.2 0-96.5-43.3-96.5-96.5S85.3 42 138.5 42 235 85.3 235 138.5 191.7 235 138.5 235zm-41.5-97.5h83v21h-83v-21zm41.5-41.5v83h-21v-83h21zm-97.5-41.5l195 195-15 15-195-195 15-15z"/></svg>
                )} {t.userManagement?.deactivateUser || "Deactivate User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Dialog */}
      {showActivateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 rounded-full p-2 mr-3">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t.userManagement?.activateUser || "Activate User"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t.userManagement?.activateConfirmation || "Are you sure you want to activate this user?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActivateDialog(null)}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {t.userManagement?.cancel || "Cancel"}
              </button>
              <button
                onClick={() => handleActivateUser(showActivateDialog)}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-60"
                disabled={actionLoading[showActivateDialog] === "activate"}
              >
                {actionLoading[showActivateDialog] === "activate" ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Star className="w-4 h-4" />
                )} {t.userManagement?.activateUser || "Activate User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
