"use client";

import { useState, useEffect } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";

interface PortfolioData {
  date: string;
  value: number;
  cash: number;
  holdings: number;
}

interface PerformanceMetrics {
  totalValue: number;
  cashBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  bestPerformer: { symbol: string; return: number } | null;
  worstPerformer: { symbol: string; return: number } | null;
}

interface PortfolioChartProps {
  data?: PortfolioData[];
  metrics?: PerformanceMetrics;
  holdings?: any[];
}

export default function PortfolioChart({ data, metrics, holdings }: PortfolioChartProps) {
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "ALL">("ALL");

  // Generate sample data if none provided
  const chartData = data || generateSampleData();

  const currentValue = metrics?.totalValue || 100000;
  const startingValue = 100000;
  const totalReturn = metrics?.totalReturn || currentValue - startingValue;
  const totalReturnPercent = metrics?.totalReturnPercent || ((currentValue - startingValue) / startingValue) * 100;
  const isPositive = totalReturn >= 0;

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-1">Total Portfolio Value</p>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold">${currentValue.toLocaleString()}</h2>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{totalReturnPercent.toFixed(2)}%</span>
            </div>
          </div>
          <p className={`text-sm mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${totalReturn.toLocaleString()} all time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-4 md:mt-0">
          {(["1D", "1W", "1M", "ALL"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-green-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={12}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? "#10b981" : "#ef4444"} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Cash Available"
          value={`$${metrics?.cashBalance.toLocaleString() || "0"}`}
        />
        <MetricCard
          icon={<Percent className="w-4 h-4" />}
          label="Return %"
          value={`${isPositive ? '+' : ''}${totalReturnPercent.toFixed(2)}%`}
          isPositive={isPositive}
        />
        <MetricCard
          icon={metrics?.dayChange && metrics.dayChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          label="Today's Change"
          value={`${metrics?.dayChange && metrics.dayChange >= 0 ? '+' : ''}$${metrics?.dayChange.toLocaleString() || "0"}`}
          isPositive={metrics?.dayChange ? metrics.dayChange >= 0 : true}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Best Performer"
          value={metrics?.bestPerformer?.symbol || "-"}
          subValue={metrics?.bestPerformer ? `+${metrics.bestPerformer.return.toFixed(1)}%` : undefined}
          isPositive={true}
        />
      </div>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  subValue,
  isPositive 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subValue?: string;
  isPositive?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-bold ${isPositive !== undefined ? (isPositive ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
        {value}
      </p>
      {subValue && (
        <p className="text-xs text-green-400 mt-1">{subValue}</p>
      )}
    </div>
  );
}

function generateSampleData(): PortfolioData[] {
  const data: PortfolioData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  let value = 100000;
  
  for (let i = 0; i <= 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Random daily change between -2% and +2%
    const change = (Math.random() - 0.5) * 0.04;
    value = value * (1 + change);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
      cash: 25000,
      holdings: Math.round(value - 25000)
    });
  }
  
  return data;
}

// Export types for use in other components
export type { PortfolioData, PerformanceMetrics };
