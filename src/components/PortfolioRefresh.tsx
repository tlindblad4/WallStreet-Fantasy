"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";

interface PortfolioRefreshProps {
  leagueMemberId: string;
  onPricesUpdated?: (prices: Record<string, number>) => void;
}

export default function PortfolioRefresh({ leagueMemberId, onPricesUpdated }: PortfolioRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refreshPortfolio = async (showLoading = true) => {
    if (!leagueMemberId) return;
    if (showLoading) setRefreshing(true);
    
    try {
      const response = await fetch("/api/portfolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueMemberId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastUpdated(new Date());
        setUpdatedCount(data.updated || 0);
        onPricesUpdated?.(data.prices || {});
      }
    } catch (error) {
      console.error("Failed to refresh portfolio:", error);
    }
    
    if (showLoading) setRefreshing(false);
  };

  // Auto-refresh once on mount
  useEffect(() => {
    if (!hasLoaded && leagueMemberId) {
      refreshPortfolio(false);
      setHasLoaded(true);
    }
  }, [hasLoaded, leagueMemberId]);

  return (
    <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        {refreshing ? (
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        )}
        <div>
          <p className="text-sm font-medium">
            {refreshing ? "Updating prices..." : "Prices updated"}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              {updatedCount > 0 ? `${updatedCount} positions · ` : ""}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => refreshPortfolio(true)}
        disabled={refreshing}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        {refreshing ? 'Updating...' : 'Refresh'}
      </button>
    </div>
  );
}
