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
  X,
  Clock,
  Newspaper,
  Target,
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
  Area,
} from "recharts";
import {
  fetchPrice,
  fetchCompanyProfile,
  fetchFinancials,
  fetchNews,
  fetchRecommendations,
  isCrypto,
  PriceData,
} from "@/lib/price-service";

// Generate mock historical data based on current price
function generateHistoricalData(currentPrice: number, days: number) {
  const data = [];
  const today = new Date();
  let price = currentPrice * 0.95; // Start slightly lower

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.48) * 0.02;
    price = price * (1 + change);
    const volume = Math.floor(Math.random() * 10000000) + 5000000;

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: parseFloat(price.toFixed(2)),
      volume,
    });
  }

  data[data.length - 1].price = currentPrice;
  return data;
}

// Format large numbers
function formatNumber(num: number | undefined): string {
  if (!num) return "N/A";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Format percentage
function formatPercent(num: number | undefined): string {
  if (!num) return "N/A";
  return `${(num * 100).toFixed(2)}%`;
}

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
  description?: string;
  industry?: string;
  sector?: string;
  website?: string;
  employees?: number;
  country?: string;
  exchange?: string;
  ipo?: string;
  marketCap?: number;
  volume?: number;
  avgVolume?: number;
  high52Week?: number;
  low52Week?: number;
  open?: number;
  previousClose?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  news?: any[];
  recommendations?: any[];
}

export default function AssetDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "1Y">("1M");
  const [chartData, setChartData] = useState<any[]>([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [tradeShares, setTradeShares] = useState("");

  useEffect(() => {
    async function fetchAssetData() {
      try {
        setLoading(true);

        // Fetch price data (works for both stocks and crypto)
        const priceData = await fetchPrice(symbol);

        if (!priceData) {
          setError("Failed to fetch price data");
          setLoading(false);
          return;
        }

        // Fetch additional data based on asset type
        const crypto = isCrypto(symbol);
        
        const [profile, financials, news, recommendations] = await Promise.all([
          fetchCompanyProfile(symbol),
          fetchFinancials(symbol),
          fetchNews(symbol),
          fetchRecommendations(symbol),
        ]);

        const metrics = financials?.metric || {};

        setAsset({
          symbol: profile && 'ticker' in profile ? profile.ticker : symbol,
          name: profile && 'name' in profile ? profile.name : symbol,
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          type: crypto ? "crypto" : "stock",

          // Company Info (stocks only)
          description: profile?.description,
          industry: profile?.finnhubIndustry,
          sector: profile?.sector,
          website: profile?.weburl,
          employees: profile?.employeeTotal,
          country: profile?.country,
          exchange: profile?.exchange,
          ipo: profile?.ipo,

          // Market Data
          marketCap: profile?.marketCapitalization
            ? profile.marketCapitalization * 1000000
            : undefined,
          volume: priceData.price * (Math.random() * 1000000 + 500000), // Estimate volume
          avgVolume: metrics["10DayAverageTradingVolume"]
            ? metrics["10DayAverageTradingVolume"] * 1000000
            : undefined,
          high52Week: metrics["52WeekHigh"],
          low52Week: metrics["52WeekLow"],
          open: priceData.open,
          previousClose: priceData.previousClose,

          // Valuation (stocks only)
          peRatio: metrics["peBasicExclExtraTTM"],
          eps: metrics["epsExclExtraItemsTTM"],
          dividendYield: metrics["dividendYieldIndicatedAnnual"],
          beta: metrics["beta"],

          // News & Analysis
          news: news || [],
          recommendations: recommendations || [],
        });

        // Generate chart data
        const days =
          timeRange === "1W" ? 7 : timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 365;
        setChartData(generateHistoricalData(priceData.price, days));
      } catch (err) {
        console.error("Error fetching asset data:", err);
        setError("Failed to load asset data");
      } finally {
        setLoading(false);
      }
    }

    fetchAssetData();
  }, [symbol, timeRange]);

  // Refresh price every 30 seconds
  useEffect(() => {
    if (!asset) return;

    const interval = setInterval(async () => {
      const priceData = await fetchPrice(symbol);
      if (priceData) {
        setAsset((prev) =>
          prev
            ? {
                ...prev,
                price: priceData.price,
                change: priceData.change,
                changePercent: priceData.changePercent,
              }
            : null
        );
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [symbol, asset]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              <p className="text-gray-400">
                {asset.symbol} • {asset.type === "crypto" ? "Cryptocurrency" : asset.exchange || "Stock"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Price Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-5xl font-bold">
              ${asset.price.toLocaleString()}
            </span>
            <span
              className={`flex items-center text-lg ${
                isPositive ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-5 h-5 mr-1" />
              ) : (
                <TrendingDown className="w-5 h-5 mr-1" />
              )}
              {isPositive ? "+" : ""}
              {asset.change.toFixed(2)} ({isPositive ? "+" : ""}
              {asset.changePercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Chart */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Price Chart</h2>
            <div className="flex gap-2">
              {(["1W", "1M", "3M", "1Y"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={isPositive ? "#10b981" : "#ef4444"}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={isPositive ? "#10b981" : "#ef4444"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis
                  stroke="#666"
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Market Cap</span>
            </div>
            <p className="text-xl font-semibold">{formatNumber(asset.marketCap)}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Volume</span>
            </div>
            <p className="text-xl font-semibold">{formatNumber(asset.volume)}</p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">52W High</span>
            </div>
            <p className="text-xl font-semibold">
              {asset.high52Week ? `$${asset.high52Week.toLocaleString()}` : "N/A"}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm">52W Low</span>
            </div>
            <p className="text-xl font-semibold">
              {asset.low52Week ? `$${asset.low52Week.toLocaleString()}` : "N/A"}
            </p>
          </div>

          {asset.peRatio && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="text-sm">P/E Ratio</span>
              </div>
              <p className="text-xl font-semibold">{asset.peRatio.toFixed(2)}</p>
            </div>
          )}

          {asset.eps && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">EPS</span>
              </div>
              <p className="text-xl font-semibold">${asset.eps.toFixed(2)}</p>
            </div>
          )}

          {asset.dividendYield && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Dividend Yield</span>
              </div>
              <p className="text-xl font-semibold">{formatPercent(asset.dividendYield)}</p>
            </div>
          )}

          {asset.beta && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Beta</span>
              </div>
              <p className="text-xl font-semibold">{asset.beta.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Company Info */}
        {asset.description && (
          <div className="bg-white/5 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-300 leading-relaxed mb-4">{asset.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {asset.industry && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Industry</p>
                  <p className="font-medium">{asset.industry}</p>
                </div>
              )}
              {asset.sector && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Sector</p>
                  <p className="font-medium">{asset.sector}</p>
                </div>
              )}
              {asset.employees && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Employees</p>
                  <p className="font-medium">{asset.employees.toLocaleString()}</p>
                </div>
              )}
              {asset.country && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Country</p>
                  <p className="font-medium">{asset.country}</p>
                </div>
              )}
              {asset.ipo && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">IPO Date</p>
                  <p className="font-medium">{asset.ipo}</p>
                </div>
              )}
              {asset.website && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-400 mb-1">Website</p>
                  <a
                    href={asset.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400 hover:underline"
                  >
                    {asset.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* News */}
        {asset.news && asset.news.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold">Latest News</h2>
            </div>
            <div className="space-y-4">
              {asset.news.slice(0, 5).map((item: any, i: number) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium mb-1">{item.headline}</p>
                      <p className="text-sm text-gray-400">
                        {item.source} • {new Date(item.datetime * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Trade Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <Button
            onClick={() => setShowTradeModal(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold h-14 text-lg shadow-lg shadow-emerald-500/20"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Trade {asset.symbol}
          </Button>
        </div>

        {/* Trade Modal */}
        {showTradeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  Trade {asset.symbol}
                </h3>
                <button
                  onClick={() => setShowTradeModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTradeType("buy")}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    tradeType === "buy"
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setTradeType("sell")}
                  className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                    tradeType === "sell"
                      ? "bg-red-500 text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  Sell
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Shares</label>
                <input
                  type="number"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
                {tradeShares && (
                  <p className="text-sm text-gray-400 mt-2">
                    ≈ ${(parseFloat(tradeShares || "0") * asset.price).toLocaleString()}
                  </p>
                )}
              </div>

              <Button
                className={`w-full h-12 font-semibold ${
                  tradeType === "buy"
                    ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
                disabled={!tradeShares || parseFloat(tradeShares) <= 0}
              >
                {tradeType === "buy" ? "Buy" : "Sell"} {tradeShares || 0} Shares
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
