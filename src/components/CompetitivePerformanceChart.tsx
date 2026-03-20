"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users } from "lucide-react";

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface CompetitivePerformanceChartProps {
  leagueId: string;
  currentUserId: string;
  startingBalance: number;
  seasonStartDate?: string;
  seasonLengthDays?: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function CompetitivePerformanceChart({
  leagueId,
  currentUserId,
  startingBalance,
  seasonStartDate,
  seasonLengthDays = 90
}: CompetitivePerformanceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [members, setMembers] = useState<Array<{userId: string; username: string; color: string; isCurrentUser: boolean}>>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "ALL">("ALL");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get league members
      const { data: leagueMembers } = await supabase
        .from("league_members")
        .select(`id, user_id, profiles:user_id(username)`)
        .eq("league_id", leagueId)
        .eq("status", "active");

      if (!leagueMembers || leagueMembers.length === 0) {
        setLoading(false);
        return;
      }

      // Setup member data
      const memberData = leagueMembers.map((m: any, index: number) => ({
        id: m.id,
        userId: m.user_id,
        username: m.profiles?.username || `Player ${index + 1}`,
        color: COLORS[index % COLORS.length],
        isCurrentUser: m.user_id === currentUserId,
      }));

      setMembers(memberData);

      // Get all trades for these members
      const memberIds = leagueMembers.map((m: any) => m.id);
      const { data: trades } = await supabase
        .from("trades")
        .select("league_member_id, created_at, type, quantity, price, symbol")
        .in("league_member_id", memberIds)
        .order("created_at", { ascending: true });

      // Determine league start date - use joined_at of first member if no season start date
      let startDate: Date;
      if (seasonStartDate) {
        startDate = new Date(seasonStartDate);
      } else if (trades && trades.length > 0) {
        startDate = new Date(trades[0].created_at);
      } else {
        // Default to 7 days ago to show some history
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }
      
      const today = new Date();
      const daysRunning = Math.max(2, Math.min(
        Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        seasonLengthDays
      ));

      // Generate data points for each day
      const dataPoints: ChartDataPoint[] = [];
      
      // Track each member's portfolio
      const portfolios: Record<string, { cash: number; holdings: Record<string, number> }> = {};
      memberData.forEach(m => {
        portfolios[m.id] = { cash: startingBalance, holdings: {} };
      });

      // Group trades by day
      const tradesByDay: Record<number, any[]> = {};
      trades?.forEach((trade: any) => {
        const tradeDate = new Date(trade.created_at);
        const dayNum = Math.ceil((tradeDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (!tradesByDay[dayNum]) tradesByDay[dayNum] = [];
        tradesByDay[dayNum].push(trade);
      });

      // Generate data for each day
      for (let day = 1; day <= daysRunning; day++) {
        // Process trades for this day
        const dayTrades = tradesByDay[day] || [];
        dayTrades.forEach((trade: any) => {
          const portfolio = portfolios[trade.league_member_id];
          const tradeValue = trade.quantity * trade.price;
          
          if (trade.type === "buy") {
            portfolio.cash -= tradeValue;
            portfolio.holdings[trade.symbol] = (portfolio.holdings[trade.symbol] || 0) + trade.quantity;
          } else {
            portfolio.cash += tradeValue;
            portfolio.holdings[trade.symbol] = (portfolio.holdings[trade.symbol] || 0) - trade.quantity;
          }
        });

        // Calculate portfolio value for each member
        const dataPoint: ChartDataPoint = { date: `Day ${day}` };
        
        memberData.forEach(member => {
          const portfolio = portfolios[member.id];
          let holdingsValue = 0;
          
          // Calculate holdings value using last known trade price
          Object.entries(portfolio.holdings).forEach(([symbol, quantity]) => {
            if (quantity > 0) {
              // Find the most recent trade price for this symbol
              const latestTrade = trades
                ?.filter((t: any) => t.symbol === symbol && t.league_member_id === member.id)
                .pop();
              const price = latestTrade?.price || 0;
              holdingsValue += quantity * price;
            }
          });
          
          dataPoint[member.username] = portfolio.cash + holdingsValue;
        });
        
        dataPoints.push(dataPoint);
      }

      setChartData(dataPoints);
      setLoading(false);
    };

    fetchData();
  }, [leagueId, currentUserId, startingBalance, seasonStartDate, seasonLengthDays]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === "ALL") return chartData;
    const days = timeRange === "1W" ? 7 : 30;
    return chartData.slice(-days);
  }, [chartData, timeRange]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No members in this league yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">League Performance</h3>
          </div>
          <p className="text-sm text-zinc-500">See how you stack up against other players</p>
        </div>
        
        <div className="flex gap-2">
          {(["1W", "1M", "ALL"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {members.map((member) => (
          <div 
            key={member.userId} 
            className={`flex items-center gap-2 text-sm ${member.isCurrentUser ? 'font-semibold' : ''}`}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: member.color }}
            />
            <span className={member.isCurrentUser ? 'text-emerald-400' : 'text-zinc-400'}>
              {member.username} {member.isCurrentUser && '(You)'}
            </span>
          </div>
        ))}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData}>
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
              formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
            />
            {members.map((member) => (
              <Line 
                key={member.userId}
                type="monotone" 
                dataKey={member.username}
                stroke={member.color}
                strokeWidth={member.isCurrentUser ? 3 : 2}
                dot={member.isCurrentUser ? { fill: member.color, strokeWidth: 0, r: 4 } : false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
