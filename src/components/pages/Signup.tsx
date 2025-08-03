import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
// @ts-ignore
import { registerUser } from "../../services/api";
import DepartmentSelector from "./DepartmentSelector";
import { useLanguage } from "./LanguageContext";

// Common passwords to prevent
const COMMON_PASSWORDS = [
  "team",
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "user",
  "test",
  "guest",
  "welcome",
  "login",
  "letmein",
  "monkey",
  "dragon",
  "master",
  "sunshine",
  "princess",
  "shadow",
  "michael",
  "jordan",
  "superman",
  "batman",
  "spider",
  "love",
  "hate",
  "secret",
  "god",
  "sex",
  "pass",
  "demo",
];

// Check if password is common/weak
const isCommonPassword = (password: string): boolean => {
  const normalizedPassword = password.toLowerCase().trim();
  return COMMON_PASSWORDS.includes(normalizedPassword);
};

const InputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  isPassword = false,
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative w-full">
      <label
        htmlFor={id}
        className="block mb-1 text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <input
        type={isPassword && showPassword ? "text" : type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-800 border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
        required
        autoComplete="off"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute top-10 right-3 text-gray-500 hover:text-gray-700"
          tabIndex={-1}
        >
          {showPassword ? (
            <MdVisibilityOff size={22} />
          ) : (
            <MdVisibility size={22} />
          )}
        </button>
      )}
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    departmentOrSector: "",
    password: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedRole, setAssignedRole] = useState<string | null>(null);

  // Helper function to determine role based on department structure
  const determineRoleFromDepartment = (departmentOrSector: string) => {
    if (!departmentOrSector) return null;

    const deptParts = departmentOrSector.split(">").map((s) => s.trim());

    // If it's exactly 2 levels (main > sub), it's a director_office
    if (deptParts.length === 2) {
      return "director_office";
    }

    // If it's exactly 3 levels (main > sub > subsub), it's an executive_head
    if (deptParts.length === 3) {
      return "executive_head";
    }

    // Default to user for any other structure
    return "user";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.departmentOrSector.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      setError(t.signup.fillAllFields);
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.signup.passwordsMismatch);
      setIsSubmitting(false);
      return;
    }

    // Check for common passwords
    if (isCommonPassword(formData.password)) {
      setError("Password is too common. Please choose a more secure password.");
      setIsSubmitting(false);
      return;
    }

    // Check password length
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        departmentOrSector: formData.departmentOrSector,
        password: formData.password,
      });
      setSuccess(response.data.message || t.signup.registrationSuccessful);
      setFormData({
        name: "",
        email: "",
        phone: "",
        departmentOrSector: "",
        password: "",
        confirmPassword: "",
      });
      setAssignedRole(null);
    } catch (err: any) {
      setError(
        `${t.signup.registrationFailed}: ` +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            err.message)
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="w-full max-w-4xl bg-white p-8 rounded-3xl shadow-2xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-teal-700 mb-4">
          {t.signup.title}
        </h2>
        <p className="text-center text-gray-600 mb-6">{t.signup.subtitle}</p>
        {(error || success) && (
          <div
            className={`mx-auto mb-6 w-full max-w-md px-4 py-3 rounded-lg text-center text-sm font-medium border ${
              error
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-green-100 text-green-700 border-green-200"
            }`}
          >
            {error || success}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label={t.signup.fullNameLabel}
              id="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.signup.fullNamePlaceholder}
            />
            <InputField
              label={t.signup.emailLabel}
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t.signup.emailPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label={t.signup.phoneNumberLabel}
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t.signup.phoneNumberPlaceholder}
            />
            <div className="w-full">
              <label
                className={`block mb-1 text-sm font-medium ${
                  !formData.departmentOrSector && error
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
                htmlFor="departmentOrSector"
              >
                {t.sent.departmentLabel} <span className="text-red-500">*</span>
              </label>
              <DepartmentSelector
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    departmentOrSector: val.fullPath,
                  }));
                  const role = determineRoleFromDepartment(val.fullPath);
                  setAssignedRole(role);
                }}
              />
              {!formData.departmentOrSector && error && (
                <div className="text-xs text-red-600 mt-1">
                  {t.sent.departmentRequired}
                </div>
              )}

              {/* Role Assignment Indicator */}
              {assignedRole && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 text-lg">👤</span>
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        You will be registered as:{" "}
                        <span className="font-bold capitalize">
                          {assignedRole.replace("_", " ")}
                        </span>
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {assignedRole === "executive_head" &&
                          "Head of sub-sub-category with management privileges"}
                        {assignedRole === "director_office" &&
                          "Director of sub-category with administrative privileges"}
                        {assignedRole === "user" &&
                          "Regular user with standard access"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label={t.signup.passwordLabel}
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t.signup.passwordPlaceholder}
              isPassword={true}
            />
            <InputField
              label={t.signup.confirmPasswordLabel}
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t.signup.passwordPlaceholder}
              isPassword={true}
            />
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              id="terms"
              required
              className="accent-teal-600"
            />
            <label htmlFor="terms" className="select-none">
              {t.signup.termsAgreement}{" "}
              <a
                href="#"
                className="underline text-teal-600 hover:text-teal-800 transition"
              >
                {t.signup.termsAndConditions}
              </a>
            </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button
              type="submit"
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 ${
                isSubmitting || !formData.departmentOrSector
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={isSubmitting || !formData.departmentOrSector}
            >
              {isSubmitting
                ? t.signup.signUpButton + "..."
                : t.signup.signUpButton}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="flex-1 py-3 bg-gray-100 text-teal-700 rounded-xl hover:bg-gray-200 transition border border-gray-300"
            >
              {t.signup.backToAdmin}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
