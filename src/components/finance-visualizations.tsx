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
  ComposedChart,
  Line,
} from "recharts";
import { Activity, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- Data generators ---

function generateStockData(points: number, basePrice: number, volatility: number) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.47) * volatility;
    price = Math.max(price + change, basePrice * 0.85);
    const open = price - (Math.random() - 0.5) * volatility * 0.5;
    const high = Math.max(price, open) + Math.random() * volatility * 0.3;
    const low = Math.min(price, open) - Math.random() * volatility * 0.3;
    data.push({
      time: new Date(now - (points - i) * 60000).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: parseFloat(price.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000 + 1000000),
    });
  }
  return data;
}

function generatePortfolioData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let value = 100000;
  return months.map((month) => {
    value += (Math.random() - 0.4) * 8000;
    return {
      month,
      value: Math.round(value),
      benchmark: Math.round(100000 + (Math.random() - 0.45) * 15000),
    };
  });
}

function generateVolumeData() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    buy: Math.floor(Math.random() * 800000 + 200000),
    sell: Math.floor(Math.random() * 700000 + 150000),
  }));
}

const TRADE_ACTIVITIES = [
  { user: "TraderX", action: "bought", symbol: "AAPL", amount: 50, type: "stock" as const },
  { user: "CryptoKing", action: "sold", symbol: "BTC", amount: 0.5, type: "crypto" as const },
  { user: "AlphaWolf", action: "bought", symbol: "NVDA", amount: 25, type: "stock" as const },
  { user: "DiamondH", action: "bought", symbol: "ETH", amount: 3.2, type: "crypto" as const },
  { user: "BullRunner", action: "sold", symbol: "TSLA", amount: 15, type: "stock" as const },
  { user: "MoonShot", action: "bought", symbol: "SOL", amount: 120, type: "crypto" as const },
  { user: "WallStBets", action: "bought", symbol: "AMD", amount: 100, type: "stock" as const },
  { user: "HodlKing", action: "sold", symbol: "ETH", amount: 5.0, type: "crypto" as const },
];

// --- Hero Chart ---

export function HeroStockChart() {
  const [data, setData] = useState(() => generateStockData(60, 182, 2.5));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.47) * 2.5;
        const newPrice = parseFloat((last.price + change).toFixed(2));
        const newOpen = parseFloat((newPrice - (Math.random() - 0.5) * 1.2).toFixed(2));
        const newPoint = {
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          price: newPrice,
          open: newOpen,
          high: parseFloat(Math.max(newPrice, newOpen).toFixed(2)) + Math.random() * 0.8,
          low: parseFloat(Math.min(newPrice, newOpen).toFixed(2)) - Math.random() * 0.8,
          volume: Math.floor(Math.random() * 5000000 + 1000000),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentPrice = data[data.length - 1]?.price ?? 0;
  const startPrice = data[0]?.price ?? 0;
  const priceChange = currentPrice - startPrice;
  const percentChange = ((priceChange / startPrice) * 100).toFixed(2);
  const isUp = priceChange >= 0;

  const minPrice = Math.min(...data.map((d) => d.price));
  const maxPrice = Math.max(...data.map((d) => d.price));

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Live Chart</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black tabular-nums text-white">${currentPrice.toFixed(2)}</span>
              <span
                className={`flex items-center gap-1 text-sm font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}
              >
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {isUp ? "+" : ""}
                {priceChange.toFixed(2)} ({percentChange}%)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["1H", "1D", "1W", "1M"].map((range) => (
              <button
                key={range}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  range === "1H"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
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
              <XAxis
                dataKey="time"
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={9}
              />
              <YAxis
                domain={[minPrice * 0.999, maxPrice * 1.001]}
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                      <div className="text-xs text-zinc-400 mb-1">{d.time}</div>
                      <div className="text-sm font-bold text-white">${d.price.toFixed(2)}</div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[10px] text-zinc-500">
                          H: <span className="text-emerald-400">${d.high.toFixed(2)}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          L: <span className="text-red-400">${d.low.toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isUp ? "#10b981" : "#ef4444"}
                strokeWidth={2}
                fill="url(#heroGradient)"
                animationDuration={300}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: isUp ? "#10b981" : "#ef4444",
                  stroke: "#18181b",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Volume mini bar */}
        <div className="h-[50px] mt-2 opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index > 0 && entry.price >= data[index - 1].price
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// --- Portfolio Performance Chart ---

export function PortfolioPerformanceChart() {
  const data = useMemo(() => generatePortfolioData(), []);
  const currentValue = data[data.length - 1]?.value ?? 0;
  const gain = currentValue - 100000;
  const gainPercent = ((gain / 100000) * 100).toFixed(1);
  const isUp = gain >= 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Portfolio Performance
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">${(currentValue / 1000).toFixed(1)}K</span>
            <span className={`text-xs font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
              {isUp ? "+" : ""}
              {gainPercent}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Your Portfolio
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            S&P 500
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={50}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                    <div className="text-xs text-zinc-400 mb-1">{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-zinc-500">{p.name}: </span>
                        <span className="font-bold text-white">
                          ${((p.value as number) / 1000).toFixed(1)}K
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name="Portfolio"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="benchmark"
              name="S&P 500"
              stroke="#52525b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Volume Chart ---

export function VolumeChart() {
  const data = useMemo(() => generateVolumeData(), []);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-1">
            Trading Volume (24h)
          </h3>
          <span className="text-2xl font-black text-white">$24.8M</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Buys
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Sells
          </div>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="hour" tick={{ fill: "#52525b", fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
                    <div className="text-xs text-zinc-400 mb-1">{label}</div>
                    {payload.map((p, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-zinc-500">{p.name}: </span>
                        <span className="font-bold text-white">
                          ${((p.value as number) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="buy" name="Buys" fill="rgba(16, 185, 129, 0.6)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="sell" name="Sells" fill="rgba(239, 68, 68, 0.4)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Live Activity Feed ---

export function LiveActivityFeed() {
  const [activities, setActivities] = useState<
    Array<{
      user: string;
      action: string;
      symbol: string;
      amount: number;
      type: "stock" | "crypto";
      timestamp: string;
      id: number;
    }>
  >([]);

  useEffect(() => {
    const initial = TRADE_ACTIVITIES.slice(0, 5).map((a, i) => ({
      ...a,
      timestamp: `${Math.floor(Math.random() * 59) + 1}s ago`,
      id: i,
    }));
    setActivities(initial);

    let counter = 5;
    const interval = setInterval(() => {
      const template = TRADE_ACTIVITIES[Math.floor(Math.random() * TRADE_ACTIVITIES.length)];
      const newActivity = {
        ...template,
        timestamp: "just now",
        id: counter++,
      };
      setActivities((prev) => [newActivity, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Live Trades</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Real-time
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0 animate-slide-up"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.action === "bought" ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {activity.action === "bought" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
              <div>
                <div className="text-sm text-white">
                  <span className="font-semibold">{activity.user}</span>{" "}
                  <span className="text-zinc-500">{activity.action}</span>{" "}
                  <span className="font-mono font-bold text-emerald-400">{activity.symbol}</span>
                </div>
                <div className="text-xs text-zinc-600">
                  {activity.amount} {activity.type === "crypto" ? "tokens" : "shares"}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">{activity.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Market Metrics ---

export function MarketMetrics() {
  const metrics = [
    {
      label: "Total Volume",
      value: "$142.5M",
      change: "+12.4%",
      isUp: true,
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      label: "Active Traders",
      value: "2,847",
      change: "+8.2%",
      isUp: true,
      icon: <Activity className="w-4 h-4" />,
    },
    {
      label: "Avg. Return",
      value: "+14.7%",
      change: "+3.1%",
      isUp: true,
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      label: "Top Gainer",
      value: "NVDA",
      change: "+28.4%",
      isUp: true,
      icon: <ArrowUpRight className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">{m.label}</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-500">
              {m.icon}
            </div>
          </div>
          <div className="text-xl font-black text-white">{m.value}</div>
          <div className={`text-xs font-semibold mt-1 ${m.isUp ? "text-emerald-400" : "text-red-400"}`}>
            {m.change}
            <span className="text-zinc-600 font-normal ml-1">vs last week</span>
          </div>
        </div>
      ))}
    </div>
  );
}
