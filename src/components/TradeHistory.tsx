"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Filter, ChevronDown } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  company_name?: string;
  trade_type: "buy" | "sell";
  shares: number;
  price_per_share: number;
  total_amount: number;
  executed_at: string;
  asset_type?: "stock" | "crypto";
}

interface TradeHistoryProps {
  trades: Trade[];
}

export default function TradeHistory({ trades }: TradeHistoryProps) {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const filteredTrades = trades.filter((trade) => {
    if (filter === "all") return true;
    return trade.trade_type === filter;
  });

  // Sort by date (newest first)
  const sortedTrades = [...filteredTrades].sort(
    (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()
  );

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Trades</h3>
        
        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "buy", "sell"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Trades List */}
      {sortedTrades.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No trades yet</p>
          <p className="text-sm mt-1">Start trading to see your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTrades.map((trade) => (
            <TradeRow
              key={trade.id}
              trade={trade}
              isExpanded={expandedTrade === trade.id}
              onToggle={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
            />
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {sortedTrades.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total Trades</span>
            <span className="font-semibold">{sortedTrades.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function TradeRow({ 
  trade, 
  isExpanded, 
  onToggle 
}: { 
  trade: Trade; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isBuy = trade.trade_type === "buy";
  const date = new Date(trade.executed_at);
  
  return (
    <div 
      className="bg-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/10 transition-colors"
      onClick={onToggle}
    >
      <div className="p-4 flex items-center justify-between">
        {/* Left: Symbol & Type */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isBuy ? (
              <ArrowDownRight className="w-5 h-5 text-green-400" />
            ) : (
              <ArrowUpRight className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <p className="font-bold">{trade.symbol}</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${
                isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isBuy ? 'Buy' : 'Sell'}
              </span>
              <span className="text-xs text-gray-400">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount & Shares */}
        <div className="text-right">
          <p className={`font-semibold ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
            {isBuy ? '-' : '+'}${trade.total_amount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400">
            {trade.shares} {trade.shares === 1 ? 'share' : 'shares'} @ ${trade.price_per_share.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Company</p>
              <p>{trade.company_name || trade.symbol}</p>
            </div>
            <div>
              <p className="text-gray-400">Asset Type</p>
              <p className="capitalize">{trade.asset_type || 'Stock'}</p>
            </div>
            <div>
              <p className="text-gray-400">Trade Time</p>
              <p>{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-gray-400">Trade ID</p>
              <p className="font-mono text-xs">{trade.id.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
