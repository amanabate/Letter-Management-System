import React from "react";

interface BadgeProps {
  count: number;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ count, className = "" }) => {
  if (count === 0) return null;

  return (
    <span
      className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

export default Badge;
