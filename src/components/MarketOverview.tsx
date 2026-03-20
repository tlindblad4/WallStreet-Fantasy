"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Activity, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

// Alpha Vantage API - Free tier: 5 calls per minute, 500/day
const ALPHA_VANTAGE_API_KEY = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || "demo";

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

// Fallback to Finnhub if Alpha Vantage fails
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

export default function MarketOverview() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [trending, setTrending] = useState<TrendingStock[]>([]);
  const [gainers, setGainers] = useState<TrendingStock[]>([]);
  const [losers, setLosers] = useState<TrendingStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>("");

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      
      // Try Alpha Vantage first, fallback to Finnhub
      const trendingSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX'];
      
      // Fetch stock data
      const stockData = await Promise.all(
        trendingSymbols.map(symbol => fetchStockAlphaVantage(symbol))
      );
      
      let validStocks = stockData.filter(Boolean) as TrendingStock[];
      
      // If Alpha Vantage fails, try Finnhub
      if (validStocks.length === 0) {
        console.log('Alpha Vantage failed, trying Finnhub...');
        const fallbackData = await Promise.all(
          trendingSymbols.map(symbol => fetchStockFinnhub(symbol))
        );
        validStocks = fallbackData.filter(Boolean) as TrendingStock[];
        setDataSource("Finnhub (delayed)");
      } else {
        setDataSource("Alpha Vantage");
      }
      
      // Sort by volume for trending
      setTrending(validStocks.sort((a, b) => b.volume - a.volume).slice(0, 5));
      
      // Sort by change % for gainers/losers
      // Remove duplicates first (in case same stock appears twice)
      const uniqueStocks = validStocks.filter((stock, index, self) => 
        index === self.findIndex((s) => s.symbol === stock.symbol)
      );
      
      console.log('Unique stocks:', uniqueStocks.map(s => `${s.symbol}: ${s.changePercent}%`));
      
      // Only show stocks with positive change in gainers
      const positiveGainers = uniqueStocks.filter(s => s.changePercent > 0);
      console.log('Gainers:', positiveGainers.map(s => `${s.symbol}: ${s.changePercent}%`));
      setGainers(positiveGainers.sort((a, b) => b.changePercent - a.changePercent).slice(0, 5));
      
      // Only show stocks with negative change in losers
      const negativeLosers = uniqueStocks.filter(s => s.changePercent < 0);
      console.log('Losers:', negativeLosers.map(s => `${s.symbol}: ${s.changePercent}%`));
      setLosers(negativeLosers.sort((a, b) => a.changePercent - b.changePercent).slice(0, 5));

      // Fetch indices (using Finnhub as Alpha Vantage doesn't have real-time indices on free tier)
      const indicesData = await Promise.all([
        fetchIndex('^GSPC', 'S&P 500'),
        fetchIndex('^DJI', 'Dow Jones'),
        fetchIndex('^IXIC', 'Nasdaq'),
        fetchIndex('BINANCE:BTCUSDT', 'Bitcoin'),
        fetchIndex('BINANCE:ETHUSDT', 'Ethereum'),
      ]);
      
      setIndices(indicesData.filter(Boolean) as MarketIndex[]);

      setLoading(false);
    };

    fetchMarketData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStockAlphaVantage = async (symbol: string): Promise<TrendingStock | null> => {
    try {
      // Alpha Vantage Global Quote endpoint
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      const data = await response.json();
      
      const quote = data['Global Quote'];
      if (quote && quote['05. price']) {
        const price = parseFloat(quote['05. price']);
        const change = parseFloat(quote['09. change']);
        const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
        const volume = parseInt(quote['06. volume']);
        
        return {
          symbol,
          name: symbol, // Alpha Vantage free tier doesn't include company names
          price,
          change,
          changePercent,
          volume,
        };
      }
      return null;
    } catch (err) {
      console.error(`Alpha Vantage error for ${symbol}:`, err);
      return null;
    }
  };

  const fetchStockFinnhub = async (symbol: string): Promise<TrendingStock | null> => {
    try {
      const timestamp = Date.now();
      const [quoteRes, profileRes] = await Promise.all([
        fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}&_=${timestamp}`),
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}&_=${timestamp}`),
      ]);
      
      const quote = await quoteRes.json();
      const profile = await profileRes.json();
      
      if (quote.c && quote.c > 0) {
        return {
          symbol,
          name: profile.name || symbol,
          price: quote.c,
          change: quote.d || 0,
          changePercent: quote.dp || 0,
          volume: quote.v || 0,
        };
      }
      return null;
    } catch (err) {
      console.error(`Finnhub error for ${symbol}:`, err);
      return null;
    }
  };

  const fetchIndex = async (symbol: string, name: string): Promise<MarketIndex | null> => {
    try {
      const timestamp = Date.now();
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}&_=${timestamp}`
      );
      const data = await response.json();
      
      if (data.c && data.c > 0) {
        return {
          symbol,
          name,
          price: data.c,
          change: data.d || 0,
          changePercent: data.dp || 0,
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching ${symbol}:`, err);
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Market Overview</h2>
          </div>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold">Market Overview</h2>
          </div>
          <span className="text-xs text-zinc-500">
            {dataSource.includes("delayed") ? "Delayed 15-20 min" : "Real-time"}
          </span>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold">Trending Stocks</h2>
          </div>
          <span className="text-xs text-zinc-500">{dataSource}</span>
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold">Top Gainers</h2>
            </div>
            <span className="text-xs text-zinc-500">{dataSource}</span>
          </div>
          
          <div className="space-y-2">
            {gainers.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">No gainers today</p>
            ) : (
              gainers.map((stock) => (
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
              ))
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold">Top Losers</h2>
            </div>
            <span className="text-xs text-zinc-500">{dataSource}</span>
          </div>
          
          <div className="space-y-2">
            {losers.length === 0 ? (
              <p className="text-center text-zinc-500 py-4">No losers today</p>
            ) : (
              losers.map((stock) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
