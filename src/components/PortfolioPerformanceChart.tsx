"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioHistory {
  date: string;
  value: number;
}

interface PortfolioPerformanceChartProps {
  leagueMemberId: string;
  startingBalance: number;
}

export default function PortfolioPerformanceChart({ 
  leagueMemberId, 
  startingBalance 
}: PortfolioPerformanceChartProps) {
  const [history, setHistory] = useState<PortfolioHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get trades to calculate historical portfolio value
      const { data: trades } = await supabase
        .from("trades")
        .select("created_at, type, quantity, price, symbol")
        .eq("league_member_id", leagueMemberId)
        .order("created_at", { ascending: true });

      if (trades && trades.length > 0) {
        // Calculate portfolio value over time
        const historyData: PortfolioHistory[] = [];
        let currentValue = startingBalance;
        const holdings: Record<string, { quantity: number; avgPrice: number }> = {};

        // Add starting point
        historyData.push({
          date: new Date(trades[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: startingBalance,
        });

        trades.forEach((trade) => {
          const tradeValue = trade.quantity * trade.price;
          
          if (trade.type === "buy") {
            currentValue -= tradeValue;
            if (!holdings[trade.symbol]) {
              holdings[trade.symbol] = { quantity: 0, avgPrice: 0 };
            }
            holdings[trade.symbol].quantity += trade.quantity;
          } else {
            currentValue += tradeValue;
            if (holdings[trade.symbol]) {
              holdings[trade.symbol].quantity -= trade.quantity;
            }
          }

          // Calculate holdings value (simplified - uses trade price)
          let holdingsValue = 0;
          Object.entries(holdings).forEach(([symbol, position]) => {
            if (position.quantity > 0) {
              // Use last known price or trade price
              holdingsValue += position.quantity * trade.price;
            }
          });

          historyData.push({
            date: new Date(trade.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: currentValue + holdingsValue,
          });
        });

        setHistory(historyData);
      } else {
        // No trades yet - show flat line at starting balance
        const today = new Date();
        setHistory([
          { date: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: startingBalance },
        ]);
      }

      setLoading(false);
    };

    fetchHistory();
  }, [leagueMemberId, startingBalance]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentValue = history[history.length - 1]?.value || startingBalance;
  const totalReturn = currentValue - startingBalance;
  const returnPercent = startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;
  const isPositive = totalReturn >= 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-sm text-zinc-500">Track your portfolio value over time</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">${currentValue.toLocaleString()}</p>
          <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">
              {isPositive ? '+' : ''}{returnPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="date" 
              stroke="#52525b" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#52525b" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Portfolio Value']}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? "#10b981" : "#ef4444"} 
              strokeWidth={2}
              dot={{ fill: isPositive ? "#10b981" : "#ef4444", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, stroke: isPositive ? "#10b981" : "#ef4444", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
