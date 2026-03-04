"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PortfolioValue {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

interface DashboardDataProps {
  leagueMembers: { id: string; league_id: string }[];
  initialData: PortfolioValue[];
}

export default function DashboardData({ leagueMembers, initialData }: DashboardDataProps) {
  const [data, setData] = useState<PortfolioValue[]>(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshValues = async () => {
    if (leagueMembers.length === 0) return;
    
    setRefreshing(true);
    const newData: PortfolioValue[] = [];

    for (const member of leagueMembers) {
      try {
        const response = await fetch("/api/portfolio/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leagueMemberId: member.id }),
        });

        if (response.ok) {
          const result = await response.json();
          newData.push({
            totalValue: result.totalValue || 0,
            totalReturn: 0,
            totalReturnPercent: 0,
          });
        }
      } catch (err) {
        console.error("Failed to refresh portfolio:", err);
      }
    }

    setData(newData);
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  // Auto-refresh on mount
  useEffect(() => {
    refreshValues();
  }, []);

  const totalValue = data.reduce((sum, d) => sum + d.totalValue, 0);
  const avgReturn = data.length > 0 
    ? data.reduce((sum, d) => sum + d.totalReturnPercent, 0) / data.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
        <div className="flex items-center gap-3">
          {refreshing ? (
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
          <div>
            <p className="text-sm font-medium">
              {refreshing ? "Updating prices..." : "Values updated"}
            </p>
            <p className="text-xs text-zinc-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={refreshValues}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Leagues"
          value={leagueMembers.length.toString()}
          icon="🏆"
        />
        <StatCard
          title="Total Portfolio Value"
          value={`$${totalValue.toLocaleString()}`}
          icon="📈"
        />
        <StatCard
          title="Avg. Return"
          value={`${avgReturn.toFixed(1)}%`}
          icon="💰"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
