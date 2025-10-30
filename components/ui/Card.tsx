import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  subtitle,
  action,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
};
