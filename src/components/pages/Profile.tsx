import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Building,
  Camera,
  Upload,
  Eye,
  EyeOff,
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "./LanguageContext";
import SignatureManager from '../common/SignatureManager';

const Profile = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentOrSector: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [changePwd, setChangePwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [changePwdMsg, setChangePwdMsg] = useState({ type: "", text: "" });
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signaturePadRef = useRef<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        departmentOrSector: userData.departmentOrSector || "",
      });

      // Set profile image if it exists
      if (userData.profileImage) {
        setProfileImage(userData.profileImage);
      } else {
        setProfileImage(null);
      }

      // Set signature image if it exists
      if (userData.signatureImage) {
        setSignatureImage(userData.signatureImage);
      }

      // Fetch latest user data from backend to ensure we have the most up-to-date info
      if (userData._id) {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/users/${userData._id}`
          );
          const updatedUser = response.data;
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          if (updatedUser.profileImage) {
            setProfileImage(updatedUser.profileImage);
          }
          if (updatedUser.signatureImage) {
            setSignatureImage(updatedUser.signatureImage);
          }
        } catch (error) {
          console.error("Failed to fetch latest user data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage({
          type: "error",
          text:
            (t as any).profile?.selectValidImage ||
            "Please select a valid image file",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text:
            (t as any).profile?.imageSizeLimit ||
            "Image size should be less than 5MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !fileInputRef.current?.files?.[0]) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("profileImage", fileInputRef.current.files[0]);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/${user._id}/profile-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update user data in localStorage with the complete user object
      const updatedUser = { ...user, profileImage: response.data.profileImage };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage({
        type: "success",
        text:
          (t as any).profile?.profilePictureUpdated ||
          "Profile picture updated successfully!",
      });

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userDataUpdated"));

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          (t as any).profile?.failedToUpload ||
          "Failed to upload profile picture",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Signature image size should be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSignatureImage = async () => {
    if (!signatureImage) return;
    setUploadingSignature(true);
    try {
      let formData;
      let isFile = false;
      let previewUrl = signatureImage;
      if (signaturePadRef.current && showSignaturePad) {
        // Drawn signature
        const dataUrl = signaturePadRef.current.getCanvas().toDataURL('image/png');
        formData = new FormData();
        const blob = await (await fetch(dataUrl)).blob();
        formData.append('signatureImage', blob, 'signature.png');
        isFile = true;
        previewUrl = dataUrl;
      } else if (signatureImage.startsWith('data:')) {
        // Uploaded image (base64)
        formData = new FormData();
        const res = await fetch(signatureImage);
        const blob = await res.blob();
        formData.append('signatureImage', blob, 'signature.png');
        isFile = true;
      }
      if (!isFile) return;
      const response = await axios.post(
        `http://localhost:5000/api/users/${user._id}/signature`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const updatedUser = { ...user, signatureImage: response.data.signatureImage };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      // Always update preview to the backend URL after save
      setSignatureImage(getSignatureImageUrl(response.data.signatureImage));
      setMessage({ type: 'success', text: 'Signature updated successfully!' });
      window.dispatchEvent(new Event('userDataUpdated'));
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload signature' });
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        formData
      );
      localStorage.setItem("user", JSON.stringify(response.data));
      setUser(response.data);
      setMessage({
        type: "success",
        text:
          (t as any).profile?.profileUpdated || "Profile updated successfully!",
      });
      setIsEditing(false);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event("userDataUpdated"));
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          (t as any).profile?.failedToUpdate ||
          "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get the correct signature image URL
  const getSignatureImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `http://localhost:5000/${img}`;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">
          {(t as any).profile?.loading || "Loading profile..."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {(t as any).profile?.title || "Profile"}
        </h2>
        <p className="text-gray-600">
          {(t as any).profile?.subtitle ||
            "View and manage your profile information"}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <img
              src={
                profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.name
                )}&background=E3F2FD&color=2563EB&size=128`
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
              title={
                (t as any).profile?.changeProfilePicture ||
                "Change profile picture"
              }
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Profile picture upload section */}
        {profileImage && profileImage !== (user.profileImage || null) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {(t as any).profile?.newProfilePicture || "New Profile Picture"}
            </h4>
            <div className="flex items-center space-x-4">
              <img
                src={profileImage}
                alt="Preview"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex space-x-2">
                <button
                  onClick={uploadProfileImage}
                  disabled={uploadingImage}
                  className={`bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 ${
                    uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploadingImage
                    ? (t as any).profile?.uploading || "Uploading..."
                    : (t as any).profile?.upload || "Upload"}
                </button>
                <button
                  onClick={() => {
                    setProfileImage(user.profileImage || null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-400"
                >
                  {(t as any).profile?.cancel || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Section */}
        <SignatureManager />

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {(t as any).profile?.name || "Name"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {(t as any).profile?.email || "Email"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {(t as any).profile?.phone || "Phone"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {(t as any).profile?.department || "Department/Sector"}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="departmentOrSector"
                  value={formData.departmentOrSector}
                  onChange={handleInputChange}
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={[
                    "Director General",
                    "Director General > Head of Office",
                    "Director General > Head of Office > Legal Services Executive",
                  ].includes(formData.departmentOrSector)}
                  title={
                    [
                      "Director General",
                      "Director General > Head of Office",
                      "Director General > Head of Office > Legal Services Executive",
                    ].includes(formData.departmentOrSector)
                      ? "This department cannot be edited."
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading
                  ? (t as any).profile?.saving || "Saving..."
                  : (t as any).profile?.saveChanges || "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
              >
                {(t as any).profile?.cancel || "Cancel"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {(t as any).profile?.name || "Name"}
                </h4>
                <p className="mt-1 text-gray-900">{user.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {(t as any).profile?.email || "Email"}
                </h4>
                <p className="mt-1 text-gray-900">{user.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {(t as any).profile?.phone || "Phone"}
                </h4>
                <p className="mt-1 text-gray-900">
                  {user.phone || (t as any).profile?.notSet || "Not set"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  {(t as any).profile?.department || "Department/Sector"}
                </h4>
                <p className="mt-1 text-gray-900">
                  {user.departmentOrSector ||
                    (t as any).profile?.notSet ||
                    "Not set"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 bg-[#C88B3D] text-white px-4 py-2 rounded-md hover:bg-[#a06d2a] transition shadow-md"
            >
              {(t as any).profile?.editProfile || "Edit Profile"}
            </button>
          </div>
        )}
      </div>
      {/* Change Password Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Change Password
        </h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setChangePwdMsg({ type: "", text: "" });
            setChangePwdLoading(true);
            if (changePwd.newPassword !== changePwd.confirmNewPassword) {
              setChangePwdMsg({
                type: "error",
                text: "New passwords do not match.",
              });
              setChangePwdLoading(false);
              return;
            }
            try {
              await axios.put(
                `http://localhost:5000/api/users/${user._id}/change-password`,
                {
                  currentPassword: changePwd.currentPassword,
                  newPassword: changePwd.newPassword,
                }
              );
              setChangePwdMsg({
                type: "success",
                text: "Password changed successfully!",
              });
              setChangePwd({
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
              });
            } catch (error: any) {
              setChangePwdMsg({
                type: "error",
                text:
                  error.response?.data?.message || "Failed to change password.",
              });
            } finally {
              setChangePwdLoading(false);
            }
          }}
          className="space-y-6"
        >
          {changePwdMsg.text && (
            <div
              className={`p-4 rounded-lg ${
                changePwdMsg.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {changePwdMsg.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={changePwd.currentPassword}
                onChange={(e) =>
                  setChangePwd({
                    ...changePwd,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 transition pr-12"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={changePwd.newPassword}
                  onChange={(e) =>
                    setChangePwd({ ...changePwd, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 transition pr-12"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={changePwd.confirmNewPassword}
                  onChange={(e) =>
                    setChangePwd({
                      ...changePwd,
                      confirmNewPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400 transition pr-12"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">
                Password Requirements
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• At least 8 characters</li>
                <li>• Mix of letters and numbers</li>
                <li>• Include special characters</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={changePwdLoading}
              className={`flex-1 py-3 ${
                changePwdLoading ? "bg-[#a06d2a]" : "bg-[#C88B3D]"
              } text-white font-semibold rounded-xl ${
                changePwdLoading ? "" : "hover:bg-[#a06d2a]"
              } transition shadow-md flex items-center justify-center`}
            >
              {changePwdLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setChangePwd({
                  currentPassword: "",
                  newPassword: "",
                  confirmNewPassword: "",
                });
                setChangePwdMsg({ type: "", text: "" });
              }}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition border border-gray-300"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
