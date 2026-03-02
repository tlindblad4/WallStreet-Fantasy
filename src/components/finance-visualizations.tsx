"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Activity, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Bitcoin, Clock } from "lucide-react";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

// Real market data types
interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

interface MarketDataState {
  sp500: StockQuote | null;
  nasdaq: StockQuote | null;
  bitcoin: StockQuote | null;
  ethereum: StockQuote | null;
  loading: boolean;
  lastUpdated: Date | null;
}

// Fetch real stock quote
async function fetchQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    
    if (data.c && data.c > 0) {
      return {
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
      };
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error);
    return null;
  }
}

// --- Market Metrics with Real Data ---

export function MarketMetrics() {
  const [data, setData] = useState<MarketDataState>({
    sp500: null,
    nasdaq: null,
    bitcoin: null,
    ethereum: null,
    loading: true,
    lastUpdated: null,
  });

  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    
    const [sp500, nasdaq, bitcoin, ethereum] = await Promise.all([
      fetchQuote("SPY"),      // S&P 500 ETF
      fetchQuote("QQQ"),      // Nasdaq ETF
      fetchQuote("BINANCE:BTCUSDT"),
      fetchQuote("BINANCE:ETHUSDT"),
    ]);

    setData({
      sp500,
      nasdaq,
      bitcoin,
      ethereum,
      loading: false,
      lastUpdated: new Date(),
    });
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { label: "S&P 500", data: data.sp500, icon: TrendingUp },
    { label: "NASDAQ", data: data.nasdaq, icon: Activity },
    { label: "Bitcoin", data: data.bitcoin, icon: Bitcoin, isCrypto: true },
    { label: "Ethereum", data: data.ethereum, icon: DollarSign, isCrypto: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const isPositive = (metric.data?.change || 0) >= 0;
        const Icon = metric.icon;
        
        return (
          <div key={metric.label} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-400 text-sm font-medium">{metric.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                <Icon className={`w-4 h-4 ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
              </div>
            </div>
            
            {data.loading && !metric.data ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-800 rounded w-24 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-16" />
              </div>
            ) : metric.data ? (
              <>
                <div className="text-2xl font-bold text-white mb-1">
                  ${metric.isCrypto ? metric.data.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : metric.data.price.toFixed(2)}
                </div>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{isPositive ? "+" : ""}{metric.data.changePercent.toFixed(2)}%</span>
                  <span className="text-zinc-500 ml-1">{metric.data.change >= 0 ? "+" : ""}${Math.abs(metric.data.change).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-500 text-sm">Unavailable</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Hero Chart with Real Data ---

export function HeroStockChart() {
  const [stockData, setStockData] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<StockQuote | null>(null);

  // Generate intraday data based on real quote
  const generateIntradayData = (quoteData: StockQuote) => {
    const data = [];
    const points = 50;
    const basePrice = quoteData.previousClose;
    const currentPrice = quoteData.price;
    const totalChange = currentPrice - basePrice;
    
    // Generate a realistic intraday trend
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const targetPrice = basePrice + (totalChange * progress);
      // Add some randomness
      const randomVolatility = (Math.random() - 0.5) * (basePrice * 0.002);
      const price = targetPrice + randomVolatility;
      
      data.push({
        time: `${9 + Math.floor((i / points) * 6)}:${Math.floor((i % 10) * 6).toString().padStart(2, "0")}`,
        price: parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 2000000 + 500000),
      });
    }
    return data;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const quoteData = await fetchQuote("SPY");
      if (quoteData) {
        setQuote(quoteData);
        setStockData(generateIntradayData(quoteData));
      }
      setLoading(false);
    };

    fetchData();
    // Update every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const isUp = (quote?.change || 0) >= 0;

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 h-[320px] flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading market data...</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">S&P 500 (SPY)</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
          <p className="text-zinc-400 text-sm">Intraday performance</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">${quote?.price.toFixed(2)}</div>
          <div className={`flex items-center justify-end gap-1 text-sm ${isUp ? "text-emerald-400" : "text-red-400"}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{isUp ? "+" : ""}{quote?.changePercent.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={stockData}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex !== undefined) setActiveIndex(Number(state.activeTooltipIndex));
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <defs>
              <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
              width={50}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-zinc-400 text-xs mb-1">{payload[0].payload.time}</p>
                      <p className="text-white font-semibold">${payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isUp ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill="url(#heroGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Open</p>
            <p className="text-sm font-medium">${quote?.open.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">High</p>
            <p className="text-sm font-medium text-emerald-400">${quote?.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Low</p>
            <p className="text-sm font-medium text-red-400">${quote?.low.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Updated {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

// --- Portfolio Performance (Simulated but realistic) ---

export function PortfolioPerformanceChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate realistic portfolio data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let value = 100000;
    const portfolioData = months.map((month) => {
      value += (Math.random() - 0.42) * 8000; // Slight upward bias
      return {
        month,
        value: Math.round(value),
        benchmark: Math.round(100000 + (Math.random() - 0.45) * 15000),
      };
    });
    setData(portfolioData);
  }, []);

  const currentValue = data[data.length - 1]?.value || 100000;
  const startingValue = 100000;
  const return_pct = ((currentValue - startingValue) / startingValue) * 100;
  const isPositive = return_pct >= 0;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-zinc-400 text-sm">Sample portfolio vs S&P 500</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${currentValue.toLocaleString()}</div>
          <div className={`text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{return_pct.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload) {
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-zinc-400 text-xs mb-1">{payload[0]?.payload.month}</p>
                      <p className="text-emerald-400 font-semibold">Portfolio: ${payload[0]?.value?.toLocaleString()}</p>
                      <p className="text-zinc-500 text-xs">S&P 500: ${payload[0]?.payload.benchmark?.toLocaleString()}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#portfolioGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Volume Chart ---

export function VolumeChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate volume data
    const volumeData = Array.from({ length: 12 }, (_, i) => ({
      hour: `${9 + i}:00`,
      buy: Math.floor(Math.random() * 800000 + 200000),
      sell: Math.floor(Math.random() * 700000 + 150000),
    }));
    setData(volumeData);
  }, []);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Trading Volume</h3>
          <p className="text-zinc-400 text-sm">Buy vs Sell pressure</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-emerald-500" />
            <span className="text-xs text-zinc-400">Buy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-red-500" />
            <span className="text-xs text-zinc-400">Sell</span>
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload) {
                  return (
                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-zinc-400 text-xs mb-1">{payload[0]?.payload.hour}</p>
                      <p className="text-emerald-400 text-sm">Buy: {(payload[0]?.value / 1000000).toFixed(1)}M</p>
                      <p className="text-red-400 text-sm">Sell: {(payload[1]?.value / 1000000).toFixed(1)}M</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="buy" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="sell" fill="#ef4444" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Live Activity Feed (Simulated) ---

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const baseActivities = [
      { user: "TraderX", action: "bought", symbol: "AAPL", amount: 50, type: "stock" },
      { user: "CryptoKing", action: "sold", symbol: "BTC", amount: 0.5, type: "crypto" },
      { user: "AlphaWolf", action: "bought", symbol: "NVDA", amount: 25, type: "stock" },
      { user: "DiamondH", action: "bought", symbol: "ETH", amount: 3.2, type: "crypto" },
      { user: "BullRunner", action: "sold", symbol: "TSLA", amount: 15, type: "stock" },
    ];

    // Add timestamps
    const withTime = baseActivities.map((a, i) => ({
      ...a,
      time: Date.now() - i * 120000, // 2 min intervals
    }));

    setActivities(withTime);

    // Simulate new activities
    const symbols = ["AAPL", "TSLA", "NVDA", "BTC", "ETH", "SOL"];
    const users = ["TraderPro", "MoonShot", "StockGenius", "CryptoWhale"];
    
    const interval = setInterval(() => {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const isCrypto = ["BTC", "ETH", "SOL"].includes(symbol);
      
      setActivities(prev => [
        {
          user,
          action: Math.random() > 0.5 ? "bought" : "sold",
          symbol,
          amount: isCrypto ? parseFloat((Math.random() * 2).toFixed(2)) : Math.floor(Math.random() * 100),
          type: isCrypto ? "crypto" : "stock",
          time: Date.now(),
        },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    }, 15000); // New activity every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Activity</h3>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real-time
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activity.action === "bought" ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                {activity.action === "bought" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-sm">
                  <span className="text-zinc-400">{activity.user}</span>
                  <span className="text-zinc-500 mx-1">{activity.action}</span>
                  <span className="font-medium">{activity.amount} {activity.symbol}</span>
                </p>
              </div>
            </div>
            <span className="text-xs text-zinc-500">{formatTime(activity.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
