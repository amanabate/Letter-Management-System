import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLanguage } from '../pages/LanguageContext';

export function StatsLineChart({ data }: { data: { date: string; value: number }[] }) {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3
        className="font-semibold mb-2 text-2xl bg-gradient-to-r from-[#b97b2a] via-[#cfae7b] to-[#cfc7b7] text-transparent bg-clip-text transition-all duration-200 hover:underline hover:text-3xl cursor-pointer"
        tabIndex={0}
      >
        {t.dashboard.lettersOverTime || "Letters Over Time"}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, filter: 'drop-shadow(0 2px 6px #3b82f655)' }}
            activeDot={{ r: 9, fill: '#2563eb', stroke: '#fff', strokeWidth: 3, filter: 'drop-shadow(0 4px 12px #2563eb55)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 