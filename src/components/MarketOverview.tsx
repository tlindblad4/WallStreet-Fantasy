"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Activity, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TrendingStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [gainers, setGainers] = useState<TrendingStock[]>([]);
  const [losers, setLosers] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      
      // Fetch major indices - use fallback symbols if market indices fail
      const indicesData = await Promise.all([
        fetchIndex('^GSPC', 'S&P 500'),
        fetchIndex('^DJI', 'Dow Jones'),
        fetchIndex('^IXIC', 'Nasdaq'),
        fetchIndex('BINANCE:BTCUSDT', 'Bitcoin'),
        fetchIndex('BINANCE:ETHUSDT', 'Ethereum'),
      ]);
      
      const validIndices = indicesData.filter(Boolean) as MarketIndex[];
      console.log('Valid indices:', validIndices);
      setIndices(validIndices);

      // Fetch trending stocks (using popular symbols)
      const trendingSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX'];
      const trendingData = await Promise.all(
        trendingSymbols.map(symbol => fetchStock(symbol))
      );
      
      const validStocks = trendingData.filter(Boolean) as TrendingStock[];
      
      // Sort by volume for trending
      setTrending(validStocks.sort((a, b) => b.volume - a.volume).slice(0, 5));
      
      // Sort by change % for gainers/losers
      setGainers(validStocks.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5));
      setLosers(validStocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5));

      setLoading(false);
    };

    fetchMarketData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchIndex = async (symbol: string, name: string): Promise<MarketIndex | null> => {
    try {
      console.log(`Fetching index: ${symbol}`);
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      
      console.log(`Index ${symbol} data:`, data);
      
      if (data.c && data.c > 0) {
        return {
          symbol,
          name,
          price: data.c,
          change: data.d,
          changePercent: data.dp,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchStock = async (symbol: string): Promise<TrendingStock | null> => {
    try {
      const [quoteRes, profileRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      ]);
      
      const quote = await quoteRes.json();
      const profile = await profileRes.json();
      
      if (quote.c) {
        return {
          symbol,
          name: profile.name || symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          volume: quote.v || 0,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no data loaded
  if (indices.length === 0 && trending.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Market Overview</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-zinc-500">Unable to load market data</p>
          <p className="text-sm text-zinc-600 mt-2">Please check your connection and refresh</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold">Market Overview</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {indices.map((index) => (
            <div key={index.symbol} className="bg-zinc-800/50 rounded-xl p-4">
              <p className="text-xs text-zinc-500 mb-1">{index.name}</p>
              <p className="font-semibold">{index.price.toLocaleString()}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${index.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {index.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                <span>{index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Stocks */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold">Trending Stocks</h2>
        </div>
        
        <div className="space-y-2">
          {trending.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/asset/${stock.symbol}`}
              className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div>
                <p className="font-semibold">{stock.symbol}</p>
                <p className="text-xs text-zinc-500 truncate max-w-[150px]">{stock.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">${stock.price.toFixed(2)}</p>
                <div className={`flex items-center gap-1 text-xs ${stock.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Gainers & Losers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Top Gainers</h2>
          </div>
          
          <div className="space-y-2">
            {gainers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/asset/${stock.symbol}`}
                className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                <div>
                  <p className="font-semibold">{stock.symbol}</p>
                  <p className="text-xs text-zinc-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${stock.price.toFixed(2)}</p>
                  <p className="text-xs text-emerald-400">+{stock.changePercent.toFixed(2)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold">Top Losers</h2>
          </div>
          
          <div className="space-y-2">
            {losers.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/asset/${stock.symbol}`}
                className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/10 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <div>
                  <p className="font-semibold">{stock.symbol}</p>
                  <p className="text-xs text-zinc-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${stock.price.toFixed(2)}</p>
                  <p className="text-xs text-red-400">{stock.changePercent.toFixed(2)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
