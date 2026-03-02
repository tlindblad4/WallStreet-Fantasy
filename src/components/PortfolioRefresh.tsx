"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface PortfolioRefreshProps {
  leagueMemberId: string;
  onRefresh?: (data: any) => void;
}

export default function PortfolioRefresh({ leagueMemberId, onRefresh }: PortfolioRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshPortfolio = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueMemberId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdated(new Date());
        onRefresh?.(data);
        // Reload page to show updated values
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to refresh portfolio:", error);
    }
    setRefreshing(false);
  };

  // Auto-refresh on page load
  useEffect(() => {
    refreshPortfolio();
  }, []);

  return (
    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${refreshing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
        <div>
          <p className="text-sm font-medium">
            {refreshing ? "Updating prices..." : "Prices updated"}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={refreshPortfolio}
        disabled={refreshing}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        Refresh
      </button>
    </div>
  );
}
