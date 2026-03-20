"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

interface MemberPerformance {
  userId: string;
  username: string;
  color: string;
  isCurrentUser: boolean;
}

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

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

export default function CompetitivePerformanceChart({
  leagueId,
  currentUserId,
  startingBalance,
  seasonStartDate,
  seasonLengthDays = 90
}: CompetitivePerformanceChartProps) {
  const [members, setMembers] = useState<MemberPerformance[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "ALL">("ALL");

  useEffect(() => {
    const fetchCompetitiveData = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get all league members
      const { data: leagueMembers } = await supabase
        .from("league_members")
        .select(`
          id,
          user_id,
          profiles:user_id(username)
        `)
        .eq("league_id", leagueId)
        .eq("status", "active");

      if (!leagueMembers || leagueMembers.length === 0) {
        setLoading(false);
        return;
      }

      // Assign colors and identify current user
      const memberData: MemberPerformance[] = leagueMembers.map((m: any, index) => ({
        userId: m.user_id,
        username: m.profiles?.username || `Player ${index + 1}`,
        color: COLORS[index % COLORS.length],
        isCurrentUser: m.user_id === currentUserId,
      }));

      setMembers(memberData);

      // Get all trades for all members
      const memberIds = leagueMembers.map((m: any) => m.id);
      const { data: allTrades } = await supabase
        .from("trades")
        .select("league_member_id, created_at, type, quantity, price, symbol")
        .in("league_member_id", memberIds)
        .order("created_at", { ascending: true });

      // Build chart data
      const dataPoints: ChartDataPoint[] = [];

      // Create a map of member_id to user data
      const memberMap = new Map(
        leagueMembers.map((m: any) => [m.id, memberData.find(md => md.userId === m.user_id)])
      );

      // Determine league start date
      const leagueStartDate = seasonStartDate ? new Date(seasonStartDate) : new Date();
      const today = new Date();
      const daysRunning = Math.max(1, Math.ceil((today.getTime() - leagueStartDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Generate timeline based on league settings
      const generateTimeline = () => {
        const timeline: string[] = [];
        const totalDays = Math.min(daysRunning, seasonLengthDays);

        // Always show start
        timeline.push("Day 1");

        // Add intermediate points based on how long league has been running
        if (totalDays > 1) {
          if (totalDays <= 7) {
            // Daily for first week
            for (let i = 2; i <= totalDays; i++) {
              timeline.push(`Day ${i}`);
            }
          } else if (totalDays <= 30) {
            // Every few days for first month
            for (let i = 2; i <= totalDays; i += 2) {
              timeline.push(`Day ${i}`);
            }
          } else {
            // Weekly after first month
            for (let i = 7; i <= totalDays; i += 7) {
              timeline.push(`Day ${i}`);
            }
          }
        }

        return timeline;
      };

      const timeline = generateTimeline();

      // Add starting point
      const startingPoint: ChartDataPoint = { date: "Day 1" };
      memberData.forEach(m => {
        startingPoint[m.username] = startingBalance;
      });
      dataPoints.push(startingPoint);

      // Calculate portfolio value for each member at each trade point
      if (allTrades && allTrades.length > 0) {
        const memberHoldings: Record<string, Record<string, { quantity: number; avgPrice: number }>> = {};
        const memberCash: Record<string, number> = {};

        // Initialize
        memberIds.forEach((id: string) => {
          memberHoldings[id] = {};
          memberCash[id] = startingBalance;
        });

        // Group trades by day number (relative to league start)
        const tradesByDay = new Map<number, any[]>();
        allTrades.forEach((trade: any) => {
          const tradeDate = new Date(trade.created_at);
          const dayNumber = Math.ceil((tradeDate.getTime() - leagueStartDate.getTime()) / (1000 * 60 * 60 * 24));
          if (!tradesByDay.has(dayNumber)) {
            tradesByDay.set(dayNumber, []);
          }
          tradesByDay.get(dayNumber)?.push(trade);
        });

        // Process each day in timeline
        timeline.slice(1).forEach(dayLabel => {
          const dayNumber = parseInt(dayLabel.replace('Day ', ''));
          const dayTrades = tradesByDay.get(dayNumber) || [];

          dayTrades.forEach((trade: any) => {
            const tradeValue = trade.quantity * trade.price;

            if (trade.type === "buy") {
              memberCash[trade.league_member_id] -= tradeValue;
              if (!memberHoldings[trade.league_member_id][trade.symbol]) {
                memberHoldings[trade.league_member_id][trade.symbol] = { quantity: 0, avgPrice: 0 };
              }
              memberHoldings[trade.league_member_id][trade.symbol].quantity += trade.quantity;
            } else {
              memberCash[trade.league_member_id] += tradeValue;
              if (memberHoldings[trade.league_member_id][trade.symbol]) {
                memberHoldings[trade.league_member_id][trade.symbol].quantity -= trade.quantity;
              }
            }
          });

          // Calculate total value for each member
          const dataPoint: ChartDataPoint = { date: dayLabel };
          
          memberIds.forEach((memberId: string) => {
            const member = memberMap.get(memberId);
            if (member) {
              let holdingsValue = 0;
              Object.entries(memberHoldings[memberId]).forEach(([symbol, position]: [string, any]) => {
                if (position.quantity > 0) {
                  // Find latest price from trades
                  const latestTrade = allTrades
                    .filter((t: any) => t.league_member_id === memberId && t.symbol === symbol)
                    .pop();
                  holdingsValue += position.quantity * (latestTrade?.price || 0);
                }
              });
              
              dataPoint[member.username] = memberCash[memberId] + holdingsValue;
            }
          });
          
          dataPoints.push(dataPoint);
        });
      }

      // If no trades, fill in remaining days with starting balance
      if (dataPoints.length < timeline.length) {
        timeline.slice(dataPoints.length).forEach(dayLabel => {
          const dataPoint: ChartDataPoint = { date: dayLabel };
          memberData.forEach(m => {
            dataPoint[m.username] = startingBalance;
          });
          dataPoints.push(dataPoint);
        });
      }

      setChartData(dataPoints);
      setLoading(false);
    };

    fetchCompetitiveData();
  }, [leagueId, currentUserId, startingBalance, seasonStartDate, seasonLengthDays]);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === "ALL" || chartData.length <= 7) return chartData;
    
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
        
        {/* Time Range Selector */}
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

      <div className="h-64">
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
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                return `$${value}`;
              }}
              domain={['dataMin - 5000', 'dataMax + 5000']}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px'
              }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
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
