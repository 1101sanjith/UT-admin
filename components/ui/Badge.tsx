import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
}) => {
  const variants = {
    default: "bg-gray-100 text-gray-700 border border-gray-300",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-brand-100 text-brand-800 border border-brand-300",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-accent-light/10 text-accent border border-accent-light/30",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};
