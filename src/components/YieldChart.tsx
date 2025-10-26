import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface YieldChartProps {
  data: Array<{
    date: string;
    yield: number;
    apy: number;
  }>;
  type?: "line" | "area";
  height?: number;
}

const YieldChart: React.FC<YieldChartProps> = ({
  data,
  type = "area",
  height = 300,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-blue-600">
            Yield: {payload[0].value.toFixed(4)} URZ
          </p>
          <p className="text-sm text-purple-600">APY: {payload[1].value}%</p>
        </div>
      );
    }
    return null;
  };

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="yield"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="apy"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: "#8B5CF6", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorApy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
        <YAxis stroke="#9CA3AF" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="yield"
          stroke="#3B82F6"
          strokeWidth={3}
          fill="url(#colorYield)"
        />
        <Area
          type="monotone"
          dataKey="apy"
          stroke="#8B5CF6"
          strokeWidth={2}
          fill="url(#colorApy)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default YieldChart;
