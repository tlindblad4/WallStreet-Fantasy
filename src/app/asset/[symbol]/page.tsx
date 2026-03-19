"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building2, 
  Globe, 
  Users,
  BarChart3,
  Activity,
  ShoppingCart,
  X
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
  description?: string;
  marketCap?: number;
  volume?: number;
  high52Week?: number;
  low52Week?: number;
  peRatio?: number;
  website?: string;
  employees?: number;
  country?: string;
  exchange?: string;
}

interface ChartData {
  date: string;
  price: number;
}

// Mock historical data generator
function generateHistoricalData(currentPrice: number, days: number): ChartData[] {
  const data: ChartData[] = [];
  const today = new Date();
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * 0.02; // 2% daily volatility
    price = price * (1 + change);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2))
    });
  }
  
  // Ensure last price matches current
  data[data.length - 1].price = currentPrice;
  
  return data;
}

export default function AssetDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "1Y">("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trade modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeQuantity, setTradeQuantity] = useState("");
  const [userLeagues, setUserLeagues] = useState<Array<{ id: string; name: string; cash_balance: number }>>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeError, setTradeError] = useState("");
  const [tradeSuccess, setTradeSuccess] = useState("");

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true);
      try {
        // Determine if crypto
        const isCrypto = symbol.length <= 4 && ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'].includes(symbol.toUpperCase());
        const finnhubSymbol = isCrypto ? `BINANCE:${symbol.toUpperCase()}USDT` : symbol.toUpperCase();
        
        // Fetch quote
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`
        );
        const quote = await quoteResponse.json();
        
        // Fetch company profile (only for stocks)
        let profile = null;
        if (!isCrypto) {
          const profileResponse = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
          );
          profile = await profileResponse.json();
        }
        
        // Fetch company metrics (only for stocks)
        let metrics = null;
        if (!isCrypto) {
          const metricsResponse = await fetch(
            `https://finnhub.io/api/v1/stock/metric?symbol=${symbol.toUpperCase()}&metric=all&token=${FINNHUB_API_KEY}`
          );
          metrics = await metricsResponse.json();
        }
        
        if (quote.c && quote.c > 0) {
          const assetData: AssetData = {
            symbol: symbol.toUpperCase(),
            name: profile?.name || symbol.toUpperCase(),
            price: quote.c,
            change: quote.d,
            changePercent: quote.dp,
            type: isCrypto ? "crypto" : "stock",
            description: profile?.description,
            marketCap: profile?.marketCapitalization ? profile.marketCapitalization * 1000000 : undefined,
            volume: metrics?.metric?.volume,
            high52Week: metrics?.metric?.["52WeekHigh"],
            low52Week: metrics?.metric?.["52WeekLow"],
            peRatio: metrics?.metric?.peBasicExclExtraTTM,
            website: profile?.weburl,
            employees: profile?.employeeTotal,
            country: profile?.country,
            exchange: profile?.exchange,
          };
          
          setAsset(assetData);
          
          // Generate chart data based on time range
          const days = timeRange === "1W" ? 7 : timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 365;
          setChartData(generateHistoricalData(quote.c, days));
        } else {
          setError("Failed to load asset data");
        }
      } catch (err) {
        console.error("Failed to fetch asset:", err);
        setError("Failed to load asset data");
      }
      setLoading(false);
    };

    if (symbol) {
      fetchAssetData();
    }
  }, [symbol, timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading asset data...</div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Asset not found"}</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = asset.change >= 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900/60 border-b border-zinc-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowTradeModal(true)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Trade
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Asset Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{asset.symbol}</h1>
                <span className={`px-2 py-1 rounded text-xs ${asset.type === 'crypto' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {asset.type === 'crypto' ? 'Crypto' : 'Stock'}
                </span>
              </div>
              <p className="text-zinc-400">{asset.name}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">${asset.price.toFixed(2)}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-lg font-semibold">
                  {isPositive ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Price Chart</h2>
            <div className="flex gap-2">
              {(["1W", "1M", "3M", "1Y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-emerald-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#10b981" : "#ef4444"} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Market Cap"
            value={asset.marketCap ? `$${(asset.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            label="Volume"
            value={asset.volume ? `${(asset.volume / 1e6).toFixed(2)}M` : 'N/A'}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="P/E Ratio"
            value={asset.peRatio ? asset.peRatio.toFixed(2) : 'N/A'}
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            label="Exchange"
            value={asset.exchange || 'N/A'}
          />
        </div>

        {/* 52 Week Range */}
        {asset.high52Week && asset.low52Week && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">52 Week Range</h3>
            <div className="relative pt-6">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ 
                    width: `${((asset.price - asset.low52Week) / (asset.high52Week - asset.low52Week)) * 100}%` 
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <div>
                  <p className="text-zinc-500">Low</p>
                  <p className="font-semibold">${asset.low52Week.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500">High</p>
                  <p className="font-semibold">${asset.high52Week.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Info */}
        {(asset.description || asset.website || asset.employees || asset.country) && (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Company Information</h3>
            
            {asset.description && (
              <p className="text-zinc-400 mb-6 leading-relaxed">{asset.description}</p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {asset.website && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">Website</p>
                    <a 
                      href={asset.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 text-sm truncate max-w-[200px] block"
                    >
                      {asset.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
              
              {asset.employees && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Users className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">Employees</p>
                    <p className="font-semibold">{asset.employees.toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {asset.country && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-zinc-500 text-sm">Country</p>
                    <p className="font-semibold">{asset.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trade Modal */}
        {showTradeModal && asset && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Trade {asset.symbol}</h2>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-zinc-400 text-sm mb-1">Current Price</p>
                <p className="text-3xl font-bold">${asset.price.toFixed(2)}</p>
              </div>

              {/* Buy/Sell Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    tradeType === "buy"
                      ? "bg-emerald-500 text-black"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                    tradeType === "sell"
                      ? "bg-red-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  Sell
                </button>
              </div>

              {/* Quantity Input */}
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">Quantity</label>
                <input
                  type="number"
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-lg"
                  placeholder="0"
                  min="1"
                />
                {tradeQuantity && (
                  <p className="text-sm text-zinc-500 mt-2">
                    Total: ${(parseInt(tradeQuantity) * asset.price).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Coming Soon Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                <p className="text-yellow-400 text-sm text-center">
                  ⚠️ Trading from asset page coming soon!
                  <br />
                  Use the Trade button in your league for now.
                </p>
              </div>

              <Button
                className="w-full"
                disabled={true}
              >
                Coming Soon
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
      <div className="flex items-center gap-2 text-zinc-500 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
