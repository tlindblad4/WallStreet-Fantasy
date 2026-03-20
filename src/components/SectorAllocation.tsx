"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieChartIcon, Building2 } from "lucide-react";

interface Holding {
  symbol: string;
  company_name?: string;
  shares: number;
  current_value: number;
  sector?: string;
}

interface SectorAllocationProps {
  holdings: Holding[];
}

const SECTOR_COLORS: Record<string, string> = {
  "Technology": "#3b82f6", // blue
  "Healthcare": "#10b981", // emerald
  "Finance": "#f59e0b", // amber
  "Consumer": "#ef4444", // red
  "Energy": "#8b5cf6", // violet
  "Industrial": "#06b6d4", // cyan
  "Other": "#6b7280", // gray
};

// Map symbols to sectors (simplified - in production this would come from an API)
const getSector = (symbol: string): string => {
  const tech = ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];
  const healthcare = ['JNJ', 'PFE', 'UNH', 'ABBV', 'MRK', 'TSLA'];
  const finance = ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA'];
  const consumer = ['AMZN', 'WMT', 'TGT', 'COST', 'NKE', 'SBUX'];
  const energy = ['XOM', 'CVX', 'COP', 'EOG', 'SLB'];
  const industrial = ['BA', 'CAT', 'GE', 'HON', 'UPS', 'FDX'];
  
  if (tech.includes(symbol)) return "Technology";
  if (healthcare.includes(symbol)) return "Healthcare";
  if (finance.includes(symbol)) return "Finance";
  if (consumer.includes(symbol)) return "Consumer";
  if (energy.includes(symbol)) return "Energy";
  if (industrial.includes(symbol)) return "Industrial";
  return "Other";
};

export default function SectorAllocation({ holdings }: SectorAllocationProps) {
  const data = useMemo(() => {
    const sectorValues: Record<string, number> = {};
    
    holdings.forEach(holding => {
      const sector = getSector(holding.symbol);
      sectorValues[sector] = (sectorValues[sector] || 0) + (holding.current_value || 0);
    });
    
    return Object.entries(sectorValues)
      .map(([name, value]) => ({
        name,
        value,
        color: SECTOR_COLORS[name] || SECTOR_COLORS["Other"],
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const totalValue = useMemo(() => 
    data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  if (holdings.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Sector Allocation</h3>
        </div>
        <p className="text-zinc-500 text-center py-8">
          No holdings to analyze
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Sector Allocation</h3>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
              }}
              formatter={(value) => {
                const numValue = Number(value);
                return [`$${numValue.toLocaleString()} (${((numValue / totalValue) * 100).toFixed(1)}%)`, ''];
              }}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              formatter={(value) => <span className="text-zinc-400 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Breakdown */}
      <div className="mt-4 space-y-2">
        {data.map((sector) => (
          <div key={sector.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: sector.color }}
              />
              <span className="text-sm">{sector.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">
                {((sector.value / totalValue) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-zinc-500 ml-2">
                ${sector.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
