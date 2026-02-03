import React from "react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  color:
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "pink"
    | "indigo"
    | "yellow";
  icon?: string;
  className?: string;
}


const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
  className = "",
}) => {
  const colorClasses = {
    blue: "border-blue-500 text-blue-600",
    green: "border-green-500 text-green-600",
    purple: "border-purple-500 text-purple-600",
    orange: "border-orange-500 text-orange-600",
    red: "border-red-500 text-red-600",
    pink: "border-pink-500 text-pink-600",
    indigo: "border-indigo-500 text-indigo-600",
    yellow: "border-yellow-500 text-yellow-600",
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 ${colorClasses[color]} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {icon && <div className="text-2xl opacity-70">{icon}</div>}
      </div>
      <p className={`text-3xl font-bold mb-2 ${colorClasses[color]}`}>
        {value}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
    </div>
  );
};

export default StatCard;
