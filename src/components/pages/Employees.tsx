import React, { useState } from "react";
import DepartmentSelector from "./DepartmentSelector";
import { LetterData } from "../../types/letter.d";
import { useLetterForm } from "../../context/LetterFormContext";
import { useLanguage } from "./LanguageContext";
import { departmentRoles } from "./departmentRoles";

interface EmployeesProps {
  letterData: LetterData;
  setLetterData: React.Dispatch<React.SetStateAction<LetterData>>;
}

const Employees: React.FC<EmployeesProps> = ({ letterData, setLetterData }) => {
  const { users, loadingUsers, fetchUsers } = useLetterForm();
  const { t, lang } = useLanguage();
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [searchEmployees, setSearchEmployees] = useState<string>("");

  // Add state to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  // Add state to control the visibility of the search results card
  const [showSearchCard, setShowSearchCard] = useState(false);

  // Helper: Toggle expand/collapse for a category
  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Get department hierarchy from translations
  const departments = t.departmentSelector.departments;
  const subCategories =
    departments.find((dept: any) => dept.label === selectedMainCategory)
      ?.subDepartments || [];
  const subSubCategories =
    subCategories.find((sub: any) => sub.label === selectedSubCategory)
      ?.subDepartments || [];

  // Build the full path for the selected sub sub category
  const currentDepartment =
    selectedMainCategory && selectedSubCategory && selectedSubSubCategory
      ? `${selectedMainCategory} > ${selectedSubCategory} > ${selectedSubSubCategory}`
      : selectedMainCategory && selectedSubCategory
      ? `${selectedMainCategory} > ${selectedSubCategory}`
      : selectedMainCategory;

  // Group users by full department path (case-insensitive)
  const employeesByDepartment: Record<string, string[]> = React.useMemo(() => {
    const grouped: Record<string, string[]> = {};
    users.forEach((user: { departmentOrSector: string; name: string }) => {
      const dept = user.departmentOrSector?.trim().toLowerCase() || "other";
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(user.name);
    });
    return grouped;
  }, [users]);

  // Get the current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Helper: get current user's sub-sub-category path
  const currentUserDeptPath = (currentUser.departmentOrSector || "")
    .split(">")
    .map((s: string) => s.trim())
    .join(" > ");

  // Filter users for searchEmployees (only users with role 'user')
  const filteredEmployees = React.useMemo(() => {
    if (!searchEmployees) return {};
    const filtered: Record<string, string[]> = {};
    Object.entries(employeesByDepartment).forEach(([dept, employees]) => {
      employees.forEach((emp) => {
        // Find the user object for this employee name
        const userObj = users.find((u) => u.name === emp);
        if (!userObj) return;
        // Only include users with role 'user'
        if (userObj.role !== "user") return;
        if (emp.toLowerCase().includes(searchEmployees.toLowerCase())) {
          if (!filtered[dept]) filtered[dept] = [];
          filtered[dept].push(emp);
        }
      });
    });
    return filtered;
  }, [employeesByDepartment, searchEmployees, users]);

  // Get all users in the current department (case-insensitive)
  const allUsersInCurrentDepartment =
    employeesByDepartment[currentDepartment?.toLowerCase?.() || ""] || [];

  // Helper: Are all users in current department already selected?
  const allSelected =
    currentDepartment &&
    allUsersInCurrentDepartment.length > 0 &&
    (letterData.ccEmployees[currentDepartment]?.length || 0) ===
      allUsersInCurrentDepartment.length;

  // Handler: Select all users in current department
  const handleSelectAll = () => {
    if (!currentDepartment) return;
    setLetterData({
      ...letterData,
      ccEmployees: {
        ...letterData.ccEmployees,
        [currentDepartment]: allUsersInCurrentDepartment,
      },
    });
  };

  // Handler: Add department path to selectedDepartments and cc
  const handleDepartmentPath = (path: string) => {
    if (!selectedDepartments.includes(path)) {
      setSelectedDepartments([...selectedDepartments, path]);
      setLetterData({
        ...letterData,
        cc: [...letterData.cc, path],
      });
    }
  };

  // --- New: Flat Category Multi-Select for CC ---
  // Build a flat list of all unique roles/labels from departmentRoles
  const flatCategories: { key: string; label: string }[] = [];
  Object.entries(departmentRoles).forEach(([catKey, roles]) => {
    roles.forEach((roleObj) => {
      // Avoid duplicates by label
      if (!flatCategories.some((c) => c.label === roleObj.label)) {
        flatCategories.push({ key: roleObj.role, label: roleObj.label });
      }
    });
  });

  // Helper: Is a flat category selected?
  const isFlatCategorySelected = (label: string) =>
    letterData.cc.includes(label);

  // Handler: Toggle flat category selection
  const handleFlatCategoryToggle = (label: string) => {
    if (isFlatCategorySelected(label)) {
      // Remove from cc and ccEmployees
      setLetterData({
        ...letterData,
        cc: letterData.cc.filter((c) => c !== label),
        ccEmployees: Object.fromEntries(
          Object.entries(letterData.ccEmployees).filter(([k]) => k !== label)
        ),
      });
    } else {
      setLetterData({
        ...letterData,
        cc: [...letterData.cc, label],
        ccEmployees: {
          ...letterData.ccEmployees,
          [label]: [], // No employees, just the category
        },
      });
    }
  };

  // Helper: Get users by department path and role
  const getUsersByDeptAndRole = (deptPath: string, roles: string[]) => {
    return users.filter(
      (u) =>
        u.departmentOrSector &&
        u.departmentOrSector.trim().toLowerCase() ===
          deptPath.trim().toLowerCase() &&
        roles.includes(u.role)
    );
  };

  // Helper: Get the correct CC recipients for a category
  const getCCRecipientsForCategory = (
    cat: any,
    parentPath: string,
    level: number
  ) => {
    const deptPath = parentPath ? `${parentPath} > ${cat.label}` : cat.label;
    if (level === 0) {
      // Director General level: only director_general, deputy_director_general, executive_advisor
      return getUsersByDeptAndRole(deptPath, [
        "director_general",
        "deputy_director_general",
        "executive_advisor",
      ]);
    } else if (level === 1) {
      // Sub-category: director_office only
      return getUsersByDeptAndRole(deptPath, ["director_office"]);
    } else if (level === 2) {
      // Sub-sub-category: executive_head only
      return getUsersByDeptAndRole(deptPath, ["executive_head"]);
    }
    return [];
  };

  // When sub sub category changes, update selectedDepartments/cc
  React.useEffect(() => {
    if (selectedMainCategory && selectedSubCategory && selectedSubSubCategory) {
      const path = `${selectedMainCategory} > ${selectedSubCategory} > ${selectedSubSubCategory}`;
      handleDepartmentPath(path);
    }
  }, [selectedMainCategory, selectedSubCategory, selectedSubSubCategory]);

  // Replace the Main Category, Sub-category, and Sub-sub-category sections with a tree-like, always-expanded, indented multi-select UI

  // Helper: Render categories recursively with expand/collapse
  const renderCategoryTree = (
    categories: any[],
    parentPath = "",
    level = 0
  ) => {
    return categories.map((cat) => {
      const hasSub = cat.subDepartments && cat.subDepartments.length > 0;
      const isExpanded = !!(expandedCategories[cat.label] ?? level === 0); // Always boolean
      const deptPath = parentPath ? `${parentPath} > ${cat.label}` : cat.label;
      return (
        <div
          key={cat.label}
          style={{ marginLeft: `${level * 20}px` }}
          className="mb-1"
        >
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-blue-600 rounded"
              checked={letterData.cc.includes(cat.label)}
              onChange={() => {
                if (letterData.cc.includes(cat.label)) {
                  setLetterData({
                    ...letterData,
                    cc: letterData.cc.filter((c) => c !== cat.label),
                    ccEmployees: Object.fromEntries(
                      Object.entries(letterData.ccEmployees).filter(
                        ([k]) => k !== cat.label
                      )
                    ),
                  });
                } else {
                  let ccRecipients = [];
                  const deptPath = parentPath
                    ? `${parentPath} > ${cat.label}`
                    : cat.label;
                  if (level === 0) {
                    // For level 0 (Director General), include all users with departmentOrSector "director_general" and specified roles
                    ccRecipients = users.filter(
                      (u) =>
                        u.departmentOrSector &&
                        u.departmentOrSector.trim().toLowerCase() ===
                          "director_general" &&
                        [
                          "director_general",
                          "deputy_director_general",
                          "executive_advisor",
                          "director_office",
                        ].includes(u.role)
                    );
                  } else if (level === 1) {
                    // For level 1 (sub-categories), include users with matching departmentOrSector and director_office role
                    const normalizedLabel = cat.label
                      .trim()
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    ccRecipients = users.filter(
                      (u) =>
                        u.departmentOrSector &&
                        u.departmentOrSector
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "_")
                          .includes(normalizedLabel) &&
                        u.role === "director_office"
                    );
                  } else if (level === 2) {
                    // For level 2 (sub-sub-categories), include users with matching departmentOrSector and executive_head role
                    const normalizedLabel = cat.label
                      .trim()
                      .toLowerCase()
                      .replace(/\s+/g, "_");
                    ccRecipients = users.filter(
                      (u) =>
                        u.departmentOrSector &&
                        u.departmentOrSector
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, "_")
                          .includes(normalizedLabel) &&
                        u.role === "executive_head"
                    );
                  } else {
                    // For other levels, keep previous logic (special roles)
                    ccRecipients = getCCRecipientsForCategory(
                      cat,
                      parentPath,
                      level
                    );
                  }
                  setLetterData({
                    ...letterData,
                    cc: [...letterData.cc, cat.label],
                    ccEmployees: {
                      ...letterData.ccEmployees,
                      [cat.label]: ccRecipients.map((u) => u.name),
                    },
                  });
                }
              }}
            />
            <span className="ml-2 text-sm text-gray-700">{cat.label}</span>
            {hasSub && (
              <button
                type="button"
                className={`ml-2 focus:outline-none transition-all duration-200 shadow-md
                  ${
                    isExpanded
                      ? "bg-[#C9252B] hover:bg-[#D6954C]"
                      : "bg-[#0C3D5A]/80 hover:bg-[#D6954C]"
                  }
                  rounded-full w-6 h-6 flex items-center justify-center border-2 border-white`}
                onClick={() => toggleCategory(cat.label)}
                aria-label={isExpanded ? "Collapse" : "Expand"}
                style={{
                  boxShadow: "0 2px 8px rgba(12,61,90,0.10)",
                  minWidth: "1.5rem",
                  minHeight: "1.5rem",
                }}
              >
                <span
                  className="text-white text-lg font-bold transition-transform duration-200"
                  style={{
                    display: "inline-block",
                    transform: isExpanded ? "rotate(0deg)" : "rotate(0deg)",
                  }}
                >
                  {isExpanded ? "−" : "+"}
                </span>
              </button>
            )}
          </label>
          {hasSub && isExpanded && (
            <div>
              {renderCategoryTree(cat.subDepartments, deptPath, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Show card when searching and there are results
  React.useEffect(() => {
    setShowSearchCard(
      !!searchEmployees && Object.keys(filteredEmployees).length > 0
    );
  }, [searchEmployees, filteredEmployees]);

  // Handler to close the card
  const closeSearchCard = () => setShowSearchCard(false);

  // Handler to select a user
  const handleSelectUser = (dept: string, emp: string) => {
    // Add to ccEmployees for the department
    setLetterData((prev) => ({
      ...prev,
      ccEmployees: {
        ...prev.ccEmployees,
        [dept]: [...(prev.ccEmployees[dept] || []), emp],
      },
    }));
    closeSearchCard();
  };

  // Click outside handler
  const cardRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeSearchCard();
      }
    }
    if (showSearchCard) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchCard]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {t.employees.ccLabel}
        </label>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {t.employees.confidential}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{t.employees.ccDescription}</p>

      {/* Tree-like, always-expanded, indented multi-select UI */}
      <div className="mb-4">{renderCategoryTree(departments)}</div>

      {/* Selected Categories and Employees at the bottom */}
      {(letterData.cc.length > 0 ||
        Object.values(letterData.ccEmployees).some(
          (arr) => arr.length > 0
        )) && (
        <div className="mt-6 p-4 bg-[#F8F8F8] border border-[#D6954C] rounded-xl shadow-sm">
          <div className="text-sm font-semibold text-[#0C3D5A] mb-2 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#D6954C]"></span>
            Selected Categories & Employees:
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Selected Categories */}
            {letterData.cc.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center px-3 py-1 rounded-full bg-[#0C3D5A]/80 text-white text-sm font-medium shadow"
              >
                {cat}
                <button
                  type="button"
                  className="ml-2 text-[#C9252B] hover:text-[#D6954C] text-lg font-bold focus:outline-none"
                  onClick={() => {
                    setLetterData({
                      ...letterData,
                      cc: letterData.cc.filter((c) => c !== cat),
                      ccEmployees: Object.fromEntries(
                        Object.entries(letterData.ccEmployees).filter(
                          ([k]) => k !== cat
                        )
                      ),
                    });
                  }}
                  aria-label={`Remove ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
            {/* Selected Employees (from search) */}
            {Object.entries(letterData.ccEmployees).flatMap(([dept, emps]) =>
              emps.map((emp) => (
                <span
                  key={dept + "-" + emp}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-[#D6954C] text-[#0C3D5A] text-sm font-medium shadow border border-[#0C3D5A]"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {emp}
                  <button
                    type="button"
                    className="ml-2 text-[#C9252B] hover:text-[#D6954C] text-lg font-bold focus:outline-none"
                    onClick={() => {
                      setLetterData((prev) => ({
                        ...prev,
                        ccEmployees: {
                          ...prev.ccEmployees,
                          [dept]: prev.ccEmployees[dept].filter(
                            (e) => e !== emp
                          ),
                        },
                      }));
                    }}
                    aria-label={`Remove ${emp}`}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* Display selected category path */}
      {currentDepartment && (
        <div className="mt-3 mb-4">
          <span className="text-sm font-medium text-gray-700">
            Selected Category:
          </span>
          <div className="mt-1 text-sm text-blue-600">{currentDepartment}</div>
          {/* Select All checkbox for sub sub category */}
          {selectedSubSubCategory && allUsersInCurrentDepartment.length > 0 && (
            <div className="mt-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  checked={!!allSelected}
                  onChange={(e) => {
                    if (!currentDepartment) return;
                    const newCcEmployees = { ...letterData.ccEmployees };
                    if (e.target.checked) {
                      newCcEmployees[currentDepartment] =
                        allUsersInCurrentDepartment;
                    } else {
                      // Remove all employees for this category
                      delete newCcEmployees[currentDepartment];
                    }
                    setLetterData({
                      ...letterData,
                      ccEmployees: newCcEmployees,
                    });
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {selectedSubSubCategory}
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t pt-2">
        <input
          type="text"
          placeholder="Search employees..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-2"
          onChange={(e) => setSearchEmployees(e.target.value)}
          value={searchEmployees}
        />

        {loadingUsers ? (
          <div className="text-gray-500 text-sm">Loading employees...</div>
        ) : !searchEmployees && currentDepartment ? (
          // Display users for selected department when not searching
          <div className="grid grid-cols-2 gap-2">
            {(employeesByDepartment[currentDepartment.toLowerCase()] || []).map(
              (emp) => (
                <label key={emp} className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      letterData.ccEmployees[currentDepartment]?.includes(
                        emp
                      ) || false
                    }
                    onChange={(e) => {
                      const updatedEmployees = e.target.checked
                        ? [
                            ...(letterData.ccEmployees[currentDepartment] ||
                              []),
                            emp,
                          ]
                        : letterData.ccEmployees[currentDepartment]?.filter(
                            (x: string) => x !== emp
                          ) || [];
                      setLetterData({
                        ...letterData,
                        ccEmployees: {
                          ...letterData.ccEmployees,
                          [currentDepartment]: updatedEmployees,
                        },
                      });
                    }}
                  />
                  <span>{emp}</span>
                </label>
              )
            )}
          </div>
        ) : null}
      </div>

      {showSearchCard && (
        <div
          ref={cardRef}
          className="fixed z-50 left-1/2 transform -translate-x-1/2 mt-2 w-full max-w-md bg-white border border-[#D6954C] rounded-xl shadow-lg p-4"
          tabIndex={0}
          style={{ top: "20%", minWidth: "320px" }}
        >
          <button
            className="absolute top-2 right-2 text-[#C9252B] text-xl font-bold focus:outline-none hover:text-[#D6954C]"
            onClick={closeSearchCard}
            aria-label="Close search results"
          >
            ×
          </button>
          <div className="font-semibold text-[#0C3D5A] mb-2">
            Search Results
          </div>
          <ul className="overflow-y-auto" style={{ maxHeight: "260px" }}>
            {Object.entries(filteredEmployees).flatMap(([dept, employees]) =>
              employees.map((emp) => (
                <li
                  key={dept + "-" + emp}
                  className="py-2 px-3 hover:bg-[#F8F8F8] rounded flex items-center gap-2 cursor-pointer"
                  style={{ minHeight: "48px" }}
                  onClick={() => handleSelectUser(dept, emp)}
                >
                  <span className="font-medium text-[#0C3D5A]">{emp}</span>
                  <span className="text-xs text-[#D6954C] bg-[#0C3D5A]/10 px-2 py-1 rounded-full ml-2">
                    {dept}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Employees;
