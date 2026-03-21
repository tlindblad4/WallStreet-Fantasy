"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
  Briefcase,
  Calendar,
  PieChart,
  Target,
  Award,
  Newspaper,
  Info
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
  BarChart,
  Bar,
  Cell
} from "recharts";
import { GlassCard } from "@/components/ui/PremiumCards";
import { FadeIn } from "@/components/animations/FadeIn";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
  
  // Company Info
  description?: string;
  industry?: string;
  sector?: string;
  website?: string;
  employees?: number;
  country?: string;
  exchange?: string;
  ipo?: string;
  
  // Financial Metrics
  marketCap?: number;
  volume?: number;
  avgVolume?: number;
  high52Week?: number;
  low52Week?: number;
  open?: number;
  previousClose?: number;
  
  // Valuation
  peRatio?: number;
  eps?: number;
  beta?: number;
  dividendYield?: number;
  
  // Financials
  revenue?: number;
  revenueGrowth?: number;
  grossProfit?: number;
  netIncome?: number;
  profitMargin?: number;
  operatingMargin?: number;
  roe?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  
  // Analyst Data
  analystRating?: string;
  priceTarget?: number;
  numAnalysts?: number;
}

interface ChartData {
  date: string;
  price: number;
  volume?: number;
}

interface NewsItem {
  datetime: string;
  headline: string;
  source: string;
  url: string;
  summary: string;
}

// Mock historical data generator
function generateHistoricalData(currentPrice: number, days: number): ChartData[] {
  const data: ChartData[] = [];
  const today = new Date();
  let price = currentPrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * 0.02;
    price = price * (1 + change);
    const volume = Math.floor(Math.random() * 10000000) + 5000000;
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
      volume
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

export default function AssetDetailPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "1Y">("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "news">("overview");

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true);
      try {
        // Fetch quote
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        const quote = await quoteResponse.json();
        
        // Fetch company profile
        const profileResponse = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        const profile = await profileResponse.json();
        
        // Fetch basic financials
        const financialsResponse = await fetch(
          `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`
        );
        const financials = await financialsResponse.json();
        
        // Fetch news
        const today = new Date();
        const fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const newsResponse = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${today.toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`
        );
        const newsData = await newsResponse.json();
        
        // Fetch recommendation trends
        const recResponse = await fetch(
          `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        const recommendations = await recResponse.json();
        
        const metrics = financials.metric || {};
        
        setAsset({
          symbol: profile.ticker || symbol,
          name: profile.name || symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          type: symbol.includes("-") ? "crypto" : "stock",
          
          // Company Info
          description: profile.description,
          industry: profile.finnhubIndustry,
          sector: profile.sector,
          website: profile.weburl,
          employees: profile.employeeTotal,
          country: profile.country,
          exchange: profile.exchange,
          ipo: profile.ipo,
          
          // Market Data
          marketCap: profile.marketCapitalization * 1000000, // Convert from millions
          volume: quote.v,
          avgVolume: metrics["10DayAverageTradingVolume"] * 1000000,
          high52Week: metrics["52WeekHigh"],
          low52Week: metrics["52WeekLow"],
          open: quote.o,
          previousClose: quote.pc,
          
          // Valuation
          peRatio: metrics["peNormalizedAnnual"],
          eps: metrics["epsNormalizedAnnual"],
          beta: metrics["beta"],
          dividendYield: profile.dividendYield,
          
          // Financials
          revenue: metrics["revenuePerShareAnnual"] * (profile.shareOutstanding || 0),
          revenueGrowth: metrics["revenueGrowth"],
          grossProfit: metrics["grossProfitMargin"] * (metrics["revenuePerShareAnnual"] || 0),
          netIncome: metrics["netProfitMargin"] * (metrics["revenuePerShareAnnual"] || 0),
          profitMargin: metrics["netProfitMargin"],
          operatingMargin: metrics["operatingMargin"],
          roe: metrics["roe"],
          debtToEquity: metrics["totalDebt/totalEquityAnnual"],
          currentRatio: metrics["currentRatioAnnual"],
          quickRatio: metrics["quickRatioAnnual"],
          
          // Analyst Data
          analystRating: recommendations[0]?.consensus || "N/A",
          priceTarget: recommendations[0]?.targetPrice || 0,
          numAnalysts: recommendations[0]?.numberOfAnalysts || 0,
        });
        
        // Generate chart data
        const days = timeRange === "1W" ? 7 : timeRange === "1M" ? 30 : timeRange === "3M" ? 90 : 365;
        setChartData(generateHistoricalData(quote.c, days));
        
        // Set news (limit to 5 items)
        setNews((newsData || []).slice(0, 5).map((item: any) => ({
          datetime: new Date(item.datetime * 1000).toLocaleDateString(),
          headline: item.headline,
          source: item.source,
          url: item.url,
          summary: item.summary,
        })));
        
      } catch (err) {
        console.error("Error fetching asset data:", err);
        setError("Failed to load asset data");
      }
      setLoading(false);
    };

    fetchAssetData();
  }, [symbol, timeRange]);

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
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isPositive = asset.change >= 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-zinc-500 text-sm">{asset.exchange}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          {/* Asset Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{asset.name}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono text-zinc-400">{asset.symbol}</span>
                  {asset.industry && (
                    <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
                      {asset.industry}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">${asset.price.toFixed(2)}</p>
                <div className={`flex items-center gap-2 justify-end ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  <span className="text-lg font-semibold">
                    {isPositive ? '+' : ''}{asset.change.toFixed(2)} ({asset.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Market Cap</p>
                <p className="text-lg font-semibold">{formatNumber(asset.marketCap)}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-zinc-500 mb-1">Volume</p>
                <p className="text-lg font-semibold">{formatNumber(asset.volume)}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-zinc-500 mb-1">P/E Ratio</p>
                <p className="text-lg font-semibold">{asset.peRatio?.toFixed(2) || "N/A"}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-xs text-zinc-500 mb-1">52W Range</p>
                <p className="text-lg font-semibold">
                  ${asset.low52Week?.toFixed(0)} - ${asset.high52Week?.toFixed(0)}
                </p>
              </GlassCard>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {(["overview", "financials", "news"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? "bg-emerald-500 text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Chart */}
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Price Chart</h3>
                  <div className="flex gap-2">
                    {(["1W", "1M", "3M", "1Y"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          timeRange === range
                            ? "bg-emerald-500/20 text-emerald-400"
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
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Company Info */}
              {asset.description && (
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">About {asset.name}</h3>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{asset.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                    {asset.employees && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Employees</p>
                        <p className="font-semibold">{asset.employees.toLocaleString()}</p>
                      </div>
                    )}
                    {asset.country && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Country</p>
                        <p className="font-semibold">{asset.country}</p>
                      </div>
                    )}
                    {asset.sector && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Sector</p>
                        <p className="font-semibold">{asset.sector}</p>
                      </div>
                    )}
                    {asset.ipo && (
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">IPO Date</p>
                        <p className="font-semibold">{asset.ipo}</p>
                      </div>
                    )}
                  </div>
                  
                  {asset.website && (
                    <a 
                      href={asset.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-emerald-400 hover:text-emerald-300"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </GlassCard>
              )}

              {/* Key Statistics */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold">Key Statistics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Open</p>
                    <p className="font-semibold">${asset.open?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Previous Close</p>
                    <p className="font-semibold">${asset.previousClose?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Day Range</p>
                    <p className="font-semibold">
                      ${Math.min(asset.open || 0, asset.price).toFixed(2)} - ${Math.max(asset.open || 0, asset.price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">52 Week High</p>
                    <p className="font-semibold">${asset.high52Week?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">52 Week Low</p>
                    <p className="font-semibold">${asset.low52Week?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Beta</p>
                    <p className="font-semibold">{asset.beta?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">EPS (TTM)</p>
                    <p className="font-semibold">${asset.eps?.toFixed(2) || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Dividend Yield</p>
                    <p className="font-semibold">{asset.dividendYield ? (asset.dividendYield * 100).toFixed(2) + '%' : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Avg Volume</p>
                    <p className="font-semibold">{formatNumber(asset.avgVolume)}</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* Financial Metrics */}
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold">Financial Performance</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Revenue</p>
                    <p className="font-semibold">{formatNumber(asset.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Revenue Growth</p>
                    <p className={`font-semibold ${(asset.revenueGrowth || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.revenueGrowth ? (asset.revenueGrowth * 100).toFixed(1) + '%' : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Profit Margin</p>
                    <p className="font-semibold">{formatPercent(asset.profitMargin)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Operating Margin</p>
                    <p className="font-semibold">{formatPercent(asset.operatingMargin)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Return on Equity</p>
                    <p className="font-semibold">{formatPercent(asset.roe)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">Debt to Equity</p>
                    <p className="font-semibold">{asset.debtToEquity?.toFixed(2) || "N/A"}</p>
                  </div>
                </div>
              </GlassCard>

              {/* Analyst Ratings */}
              {asset.analystRating && asset.analystRating !== "N/A" && (
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold">Analyst Ratings</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Consensus</p>
                      <p className="font-semibold text-emerald-400">{asset.analystRating}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Price Target</p>
                      <p className="font-semibold">${asset.priceTarget?.toFixed(2) || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Analysts</p>
                      <p className="font-semibold">{asset.numAnalysts || "N/A"}</p>
                    </div>
                  </div>
                </GlassCard>
              )}
            </div>
          )}

          {activeTab === "news" && (
            <div className="space-y-4">
              {news.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Newspaper className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No recent news available</p>
                </GlassCard>
              ) : (
                news.map((item, index) => (
                  <GlassCard key={index} className="p-6 hover:bg-white/5 transition-colors">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-zinc-500">{item.source}</span>
                        <span className="text-xs text-zinc-500">{item.datetime}</span>
                      </div>
                      <h4 className="font-semibold mb-2 hover:text-emerald-400 transition-colors">
                        {item.headline}
                      </h4>
                      <p className="text-sm text-zinc-400 line-clamp-2">{item.summary}</p>
                    </a>
                  </GlassCard>
                ))
              )}
            </div>
          )}
        </FadeIn>
      </main>
    </div>
  );
}
