import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useLanguage } from '../pages/LanguageContext';

const STATUS_COLORS: Record<string, string> = {
  sent: "#3b82f6", // blue-500
  delivered: "#22c55e", // green-500
  pending: "#fbbf24", // yellow-400
  rejected: "#ef4444", // red-500
  draft: "#64748b", // gray-500
  approved: "#6366f1", // indigo-500
  read: "#0ea5e9", // sky-500
};

export function StatsBarChart({ data }: { data: { name: string; value: number }[] }) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const { t } = useLanguage();

  // Helper to translate status labels
  function translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      sent: t.dashboard.statusSent || 'sent',
      pending: t.dashboard.statusPending || 'pending',
      rejected: t.dashboard.statusRejected || 'rejected',
      delivered: t.dashboard.statusDelivered || 'delivered',
      read: t.dashboard.statusRead || 'read',
      approved: t.dashboard.approved || 'approved',
      draft: t.dashboard.draft || 'draft',
    };
    return statusMap[status] || status;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3
        className="font-semibold mb-2 text-2xl bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text transition-all duration-200 hover:underline hover:text-3xl cursor-pointer"
        tabIndex={0}
      >
        {t.dashboard.lettersByStatus || "Letters by Status"}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tickFormatter={translateStatus} angle={20} textAnchor="start" interval={0} height={50} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar
            dataKey="value"
            onMouseOver={(_, idx) => setActiveIndex(idx)}
            onMouseOut={() => setActiveIndex(null)}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={
                  activeIndex === idx
                    ? shadeColor(STATUS_COLORS[entry.name] || "#3b82f6", -20)
                    : STATUS_COLORS[entry.name] || "#3b82f6"
                }
                style={
                  activeIndex === idx
                    ? { filter: "drop-shadow(0 2px 8px rgba(59,130,246,0.2))", transform: "scaleY(1.08)" }
                    : {}
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Utility to darken a hex color
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);
  R = Math.min(255, Math.max(0, R + (percent / 100) * 255));
  G = Math.min(255, Math.max(0, G + (percent / 100) * 255));
  B = Math.min(255, Math.max(0, B + (percent / 100) * 255));
  return `#${(R.toString(16).padStart(2, "0"))}${(G.toString(16).padStart(2, "0"))}${(B.toString(16).padStart(2, "0"))}`;
} 