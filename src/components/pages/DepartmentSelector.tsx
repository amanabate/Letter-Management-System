import React, { useState, forwardRef, useImperativeHandle } from "react";
import { useLanguage } from "./LanguageContext";
import { departmentRoles } from "./departmentRoles";

type DepartmentOption = {
  id: string;
  label: string;
  subDepartments?: DepartmentOption[];
};

const DepartmentSelector = forwardRef<
  { reset: () => void },
  {
    onChange: (selection: { main: string; sub: string; subSub: string; fullPath: string; role: string }) => void;
    showBreadcrumb?: boolean;
    showSubDropdowns?: boolean;
    onRoleChange?: (role: string) => void;
  }
>(({ onChange, showBreadcrumb = true, showSubDropdowns = true, onRoleChange }, ref) => {
  const { t, lang } = useLanguage();

  const departments: DepartmentOption[] = t.departmentSelector.departments;

  const [selectedMainId, setSelectedMainId] = useState<string>("");
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [selectedSubSubId, setSelectedSubSubId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  useImperativeHandle(ref, () => ({
    reset: () => {
      setSelectedMainId("");
      setSelectedSubId("");
      setSelectedSubSubId("");
    },
  }));

  const selectedMain = departments.find((dept) => dept.id === selectedMainId);
  const subCategories = selectedMain?.subDepartments || [];
  const selectedSub = subCategories.find((sub) => sub.id === selectedSubId);
  const subSubCategories = selectedSub?.subDepartments || [];
  const selectedSubSub = subSubCategories.find((subSub) => subSub.id === selectedSubSubId);

  const getFullIdPath = () => {
    return [selectedMainId, selectedSubId, selectedSubSubId].filter(Boolean).join(" > ");
  };

  const getFullLabelPath = () => {
    return [selectedMain?.label, selectedSub?.label, selectedSubSub?.label].filter(Boolean).join(" > ");
  };

  const handleMainCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedMainId(event.target.value);
    setSelectedSubId("");
    setSelectedSubSubId("");
    setTimeout(() => onChange({
      main: event.target.value,
      sub: "",
      subSub: "",
      fullPath: event.target.value,
      role: selectedRole
    }), 0);
  };

  const handleSubCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedSubId(event.target.value);
    setSelectedSubSubId("");
    setTimeout(() => onChange({
      main: selectedMainId,
      sub: event.target.value,
      subSub: "",
      fullPath: [selectedMainId, event.target.value].filter(Boolean).join(" > "),
      role: selectedRole
    }), 0);
  };

  const handleSubSubCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedSubSubId(event.target.value);
    setTimeout(() => onChange({
      main: selectedMainId,
      sub: selectedSubId,
      subSub: event.target.value,
      fullPath: getFullIdPath(),
      role: selectedRole
    }), 0);
  };

  const getCurrentLabel = () => {
    if (selectedSubSubId && selectedSubSub?.label) return selectedSubSub.label;
    if (selectedSubId && selectedSub?.label) return selectedSub.label;
    if (selectedMainId && selectedMain?.label) return selectedMain.label;
    return null;
  };

  const availableRoles = (() => {
    const label = getCurrentLabel();
    // If only Director General is selected (no sub or sub-sub)
    if (
      selectedMain?.label === 'Director General' &&
      !selectedSubId &&
      !selectedSubSubId
    ) {
      return [
        { role: 'director_general', label: 'Director General' },
        { role: 'deputy_director_general', label: 'Deputy Director General' },
        { role: 'executive_advisor', label: 'Executive Advisor' },
        { role: 'director_office', label: 'Director Office' }
      ];
    }
    // If a sub-category is selected (without sub-sub-category), allow ONLY director_office role
    if (selectedSubId && selectedSub?.label && !selectedSubSubId) {
      return [
        { role: 'director_office', label: 'Director Office' }
      ];
    }
    // If a sub-sub-category is selected, show regular roles
    if (label) {
      return [
        { role: 'executive_head', label: `${label} Executive Head` },
        { role: 'user', label: 'User' }
      ];
    }
    return [];
  })();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(event.target.value);
    if (onRoleChange) onRoleChange(event.target.value);
    onChange({
      main: selectedMainId,
      sub: selectedSubId,
      subSub: selectedSubSubId,
      fullPath: getFullIdPath(),
      role: event.target.value
    });
  };

  console.log("Selected sub-sub label:", selectedSubSub?.label);
  console.log("Available roles:", availableRoles);

  // Remove the mustSelectSubSub variable and any related validation logic

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">
        {t.departmentSelector.mainCategory}
      </label>
      <select
        className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-200 mb-2"
        value={selectedMainId}
        onChange={handleMainCategoryChange}
      >
        <option value="">{t.departmentSelector.selectMainCategory}</option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.label}
          </option>
        ))}
      </select>

      {showSubDropdowns && subCategories.length > 0 && (
        <>
          <label className="block text-gray-700 font-medium mb-1">
            {t.departmentSelector.subCategory}
          </label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-200 mb-2"
            value={selectedSubId}
            onChange={handleSubCategoryChange}
          >
            <option value="">{t.departmentSelector.selectSubCategory}</option>
            {subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.label}
              </option>
            ))}
          </select>
        </>
      )}

      {showSubDropdowns && subSubCategories.length > 0 && (
        <>
          <label className="block text-gray-700 font-medium mb-1">
            {t.departmentSelector.subSubCategory} (Optional)
          </label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-200 mb-2"
            value={selectedSubSubId}
            onChange={handleSubSubCategoryChange}
          >
            <option value="">
              {t.departmentSelector.selectSubSubCategory} (Optional)
            </option>
            {subSubCategories.map((subSub) => (
              <option key={subSub.id} value={subSub.id}>
                {subSub.label}
              </option>
            ))}
          </select>
        </>
      )}

      {availableRoles.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <label className="block text-gray-700 font-medium mb-1">
            Role
          </label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 w-full bg-white focus:ring-2 focus:ring-blue-200 mb-2"
            value={selectedRole}
            onChange={handleRoleChange}
          >
            <option value="">Select Role</option>
            {availableRoles.map((role: { role: string; label: string }) => (
              <option key={role.role} value={role.role}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showBreadcrumb && getFullLabelPath() && (
        <div style={{ marginTop: "20px", color: "green" }}>
          {t.departmentSelector.selectedCategory}:{" "}
          <strong>{getFullLabelPath()}</strong>
        </div>
      )}
      {/* Do not show any validation message about sub-sub-category selection */}
    </div>
  );
});

export default DepartmentSelector;
