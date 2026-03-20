"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Filter, Calendar } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  created_at: string;
}

interface TradingHistoryProps {
  trades: Trade[];
}

type FilterType = 'all' | 'buy' | 'sell';
type SortType = 'newest' | 'oldest' | 'highest' | 'lowest';

export default function TradingHistory({ trades }: TradingHistoryProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [searchSymbol, setSearchSymbol] = useState("");

  const filteredTrades = trades
    .filter(trade => {
      if (filter === 'buy') return trade.type === 'buy';
      if (filter === 'sell') return trade.type === 'sell';
      return true;
    })
    .filter(trade => 
      searchSymbol === "" || 
      trade.symbol.toLowerCase().includes(searchSymbol.toLowerCase())
    )
    .sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return (b.quantity * b.price) - (a.quantity * a.price);
        case 'lowest':
          return (a.quantity * a.price) - (b.quantity * b.price);
        default:
          return 0;
      }
    });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalVolume = filteredTrades.reduce((sum, trade) => sum + (trade.quantity * trade.price), 0);
  const buyCount = filteredTrades.filter(t => t.type === 'buy').length;
  const sellCount = filteredTrades.filter(t => t.type === 'sell').length;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Trading History</h3>
          <p className="text-sm text-zinc-500">
            {filteredTrades.length} trades • ${totalVolume.toLocaleString()} volume
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="text-emerald-400">{buyCount} buys</span>
          <span className="text-zinc-600">|</span>
          <span className="text-red-400">{sellCount} sells</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="bg-transparent text-sm focus:outline-none"
          >
            <option value="all">All Trades</option>
            <option value="buy">Buys Only</option>
            <option value="sell">Sells Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="bg-transparent text-sm focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Value</option>
            <option value="lowest">Lowest Value</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search symbol..."
          value={searchSymbol}
          onChange={(e) => setSearchSymbol(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Trades List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredTrades.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            No trades match your filters
          </p>
        ) : (
          filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  trade.type === 'buy' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                }`}>
                  {trade.type === 'buy' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{trade.symbol}</p>
                  <p className="text-xs text-zinc-500">
                    {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.quantity} shares
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${(trade.quantity * trade.price).toLocaleString()}</p>
                <p className="text-xs text-zinc-500">
                  @ ${trade.price.toFixed(2)} • {formatDate(trade.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
