import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-brand-500 hover:bg-brand-600 text-white shadow-md hover:shadow-lg focus:ring-brand-400",
    secondary:
      "bg-accent hover:bg-accent-light text-white shadow-md hover:shadow-lg focus:ring-accent-light",
    danger:
      "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-400",
    success:
      "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg focus:ring-green-400",
    outline:
      "border-2 border-gray-300 hover:border-brand-500 hover:bg-brand-50 text-gray-700 hover:text-brand-700 bg-white focus:ring-brand-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
