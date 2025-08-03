import React, { useRef } from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { useLanguage, translations } from '../pages/LanguageContext';

Chart.register(ArcElement, Tooltip, Legend);

const PIE_COLORS = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#fbbf24", // yellow-400
  "#ef4444", // red-500
  "#6366f1", // indigo-500
  "#0ea5e9", // sky-500
];

export function StatsPieChart({ data }: { data: { name: string; value: number }[] }) {
  const chartRef = useRef<any>(null);
  const { t, lang } = useLanguage();
  const chartData = {
    labels: data.map((d) => d.name.split('>').pop()?.trim() || d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: PIE_COLORS,
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 12,
        hoverBorderColor: "#2563eb",
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            return `${translateDepartment(label)}: ${value}`;
          }
        }
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };
  // Helper to robustly translate department label using departmentSelector
  function translateDepartment(label: string): string {
    const search = label.trim().toLowerCase();
    function findLabelPair(enDepts: any[], amDepts: any[]): string | null {
      for (let i = 0; i < enDepts.length; i++) {
        const enDept = enDepts[i];
        const amDept = amDepts[i];
        if (enDept.label.trim().toLowerCase() === search) return amDept.label;
        if (enDept.subDepartments && amDept.subDepartments) {
          const found = findLabelPair(enDept.subDepartments, amDept.subDepartments);
          if (found) return found;
        }
      }
      return null;
    }
    if (lang === 'am') {
      const enDepts = translations.en.departmentSelector.departments;
      const amDepts = translations.am.departmentSelector.departments;
      const found = findLabelPair(enDepts, amDepts);
      return found || label;
    } else {
      return label;
    }
  }
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3
        className="font-semibold mb-2 text-2xl bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text transition-all duration-200 hover:underline hover:text-3xl cursor-pointer"
        tabIndex={0}
      >
        {t.dashboard.lettersByDepartment || "Letters by Department"}
      </h3>
      <Pie ref={chartRef} data={chartData} options={options} />
      <div className="mt-4 max-h-32 overflow-y-auto flex flex-col gap-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {chartData.labels.map((label: string, idx: number) => (
          <div key={label} className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
            <span className="text-sm text-gray-700">{translateDepartment(label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 