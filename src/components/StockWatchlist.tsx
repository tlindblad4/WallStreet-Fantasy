"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Star, TrendingUp, TrendingDown, X } from "lucide-react";
import Link from "next/link";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function StockWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [stocks, setStocks] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatchlist = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's watchlist from localStorage or database
      const saved = localStorage.getItem(`watchlist-${user.id}`);
      const symbols = saved ? JSON.parse(saved) : ['AAPL', 'TSLA', 'NVDA'];
      setWatchlist(symbols);

      // Fetch prices
      await fetchPrices(symbols);
      setLoading(false);
    };

    fetchWatchlist();
  }, []);

  const fetchPrices = async (symbols: string[]) => {
    const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";
    
    const stockData = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const [quoteRes, profileRes] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`),
          ]);
          
          const quote = await quoteRes.json();
          const profile = await profileRes.json();
          
          return {
            symbol,
            name: profile.name || symbol,
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
          };
        } catch {
          return null;
        }
      })
    );
    
    setStocks(stockData.filter(Boolean) as WatchlistItem[]);
  };

  const removeFromWatchlist = (symbol: string) => {
    const newWatchlist = watchlist.filter(s => s !== symbol);
    setWatchlist(newWatchlist);
    setStocks(stocks.filter(s => s.symbol !== symbol));
    
    // Save to localStorage
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`watchlist-${user.id}`, JSON.stringify(newWatchlist));
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold">Watchlist</h2>
      </div>

      <div className="space-y-2">
        {stocks.map((stock) => (
          <div
            key={stock.symbol}
            className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors group"
          >
            <Link href={`/asset/${stock.symbol}`} className="flex-1 flex items-center gap-3">
              <div>
                <p className="font-semibold">{stock.symbol}</p>
                <p className="text-xs text-zinc-500 truncate max-w-[120px]">{stock.name}</p>
              </div>
            </Link>
            
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="font-medium">${stock.price?.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-xs ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%</span>
                </div>
              </div>
              
              <button
                onClick={() => removeFromWatchlist(stock.symbol)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {stocks.length === 0 && (
        <p className="text-center text-zinc-500 py-4">
          No stocks in watchlist
        </p>
      )}
    </div>
  );
}
