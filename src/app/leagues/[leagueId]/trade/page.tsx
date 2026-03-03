"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Search, DollarSign, Bitcoin, TrendingUp, Activity } from "lucide-react";
import HoldingsList from "@/components/HoldingsList";
import TradeHistory from "@/components/TradeHistory";
import OptionsChain from "@/components/OptionsChain";
import OptionsPositions from "@/components/OptionsPositions";
import PortfolioRefresh from "@/components/PortfolioRefresh";

interface Asset {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
}

const POPULAR_CRYPTO = [
  { symbol: "BINANCE:BTCUSDT", displaySymbol: "BTC", description: "Bitcoin", type: "crypto" as const },
  { symbol: "BINANCE:ETHUSDT", displaySymbol: "ETH", description: "Ethereum", type: "crypto" as const },
  { symbol: "BINANCE:SOLUSDT", displaySymbol: "SOL", description: "Solana", type: "crypto" as const },
  { symbol: "BINANCE:ADAUSDT", displaySymbol: "ADA", description: "Cardano", type: "crypto" as const },
  { symbol: "BINANCE:DOTUSDT", displaySymbol: "DOT", description: "Polkadot", type: "crypto" as const },
];

export default function TradePage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [shares, setShares] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cashBalance, setCashBalance] = useState(0);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [allowOptions, setAllowOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "crypto">("all");
  const [tradingMode, setTradingMode] = useState<"assets" | "options">("assets");
  const [memberId, setMemberId] = useState<string>("");
  
  const supabase = createClient();

  useEffect(() => {
    const loadPortfolio = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !leagueId) return;

      const { data: member } = await supabase
        .from("league_members")
        .select("id, cash_balance")
        .eq("league_id", leagueId)
        .eq("user_id", user.id)
        .single();

      if (member) {
        setCashBalance(member.cash_balance);
        setMemberId(member.id);
        
        // Check if options trading is allowed
        const { data: league } = await supabase
          .from("leagues")
          .select("allow_options_trading")
          .eq("id", leagueId)
          .single();
        setAllowOptions(league?.allow_options_trading || false);
        
        const { data: holdings } = await supabase
          .from("portfolio_holdings")
          .select("*")
          .eq("league_member_id", member.id);
        setPortfolio(holdings || []);

        const { data: tradesData } = await supabase
          .from("trades")
          .select("*")
          .eq("league_member_id", member.id)
          .order("executed_at", { ascending: false })
          .limit(20);
        setTrades(tradesData || []);

        // Load options
        const { data: optionsData } = await supabase
          .from("options_contracts")
          .select("*")
          .eq("league_member_id", member.id)
          .order("created_at", { ascending: false });
        setOptions(optionsData || []);
      }
    };

    loadPortfolio();
  }, [leagueId, supabase]);

  const handleSearch = async () => {
    setLoading(true);
    let results: Asset[] = [];

    if (activeTab === "all" || activeTab === "stocks") {
      if (searchQuery.trim()) {
        const response = await fetch(`/api/stocks/search?q=${searchQuery}&type=stock`);
        const data = await response.json();
        results = [...results, ...(data.results || []).map((r: any) => ({ ...r, type: "stock" }))];
      }
    }

    if (activeTab === "all" || activeTab === "crypto") {
      if (searchQuery.trim()) {
        const response = await fetch(`/api/stocks/search?q=${searchQuery}&type=crypto`);
        const data = await response.json();
        results = [...results, ...(data.results || []).map((r: any) => ({ ...r, type: "crypto" }))];
      } else if (activeTab === "crypto") {
        results = POPULAR_CRYPTO.map(c => ({ ...c, name: c.description, price: 0, change: 0, changePercent: 0, type: "crypto" as const }));
      }
    }

    setSearchResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === "crypto" && !searchQuery) {
      setSearchResults(POPULAR_CRYPTO.map(c => ({ ...c, name: c.description, price: 0, change: 0, changePercent: 0, type: "crypto" as const })));
    } else if (activeTab === "stocks") {
      setSearchResults([]);
    }
  }, [activeTab, searchQuery]);

  const handleSelectAsset = async (asset: Asset) => {
    const type = asset.type || (asset.symbol.includes(":") ? "crypto" : "stock");
    const response = await fetch(`/api/stocks/quote?symbol=${asset.symbol}&type=${type}`);
    const quote = await response.json();
    setSelectedAsset({ ...asset, ...quote, type });
    setSearchResults([]);
    setSearchQuery("");
  };

  const executeTrade = async () => {
    if (!selectedAsset || !shares || !leagueId) return;
    setLoading(true);
    setError("");

    const total = selectedAsset.price * parseFloat(shares);
    if (tradeType === "buy" && total > cashBalance) {
      setError("Insufficient funds");
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/leagues/${leagueId}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: selectedAsset.displaySymbol || selectedAsset.symbol,
        company_name: selectedAsset.name,
        trade_type: tradeType,
        shares: parseFloat(shares),
        price_per_share: selectedAsset.price,
        asset_type: selectedAsset.type || "stock",
      }),
    });

    if (response.ok) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from("league_members")
          .select("id, cash_balance")
          .eq("league_id", leagueId)
          .eq("user_id", user.id)
          .single();

        if (member) {
          setCashBalance(member.cash_balance);
          const { data: holdings } = await supabase
            .from("portfolio_holdings")
            .select("*")
            .eq("league_member_id", member.id);
          setPortfolio(holdings || []);

          const { data: tradesData } = await supabase
            .from("trades")
            .select("*")
            .eq("league_member_id", member.id)
            .order("executed_at", { ascending: false })
            .limit(20);
          setTrades(tradesData || []);
        }
      }
      setSelectedAsset(null);
      setShares("");
    } else {
      const data = await response.json();
      setError(data.error || "Trade failed");
    }
    setLoading(false);
  };

  const handleBuyOption = async (option: any, contracts: number) => {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/leagues/${leagueId}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        underlying_symbol: option.underlying,
        option_type: option.type,
        strike_price: option.strike,
        expiration_date: option.expiration,
        contracts,
        premium_per_contract: option.ask,
      }),
    });

    if (response.ok) {
      // Reload data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from("league_members")
          .select("id, cash_balance")
          .eq("league_id", leagueId)
          .eq("user_id", user.id)
          .single();

        if (member) {
          setCashBalance(member.cash_balance);
          const { data: optionsData } = await supabase
            .from("options_contracts")
            .select("*")
            .eq("league_member_id", member.id)
            .order("created_at", { ascending: false });
          setOptions(optionsData || []);
        }
      }
    } else {
      const data = await response.json();
      setError(data.error || "Options trade failed");
    }
    setLoading(false);
  };

  const total = selectedAsset ? selectedAsset.price * (parseFloat(shares) || 0) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href={`/leagues/${leagueId}`} className="text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">Back</span>
            </Link>
            <h1 className="text-base sm:text-xl font-bold">Trade</h1>
            <div className="text-right">
              <p className="text-[10px] sm:text-sm text-zinc-500">Buying Power</p>
              <p className="text-base sm:text-xl font-bold text-emerald-400">${cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {/* Auto-refresh prices */}
        {memberId && (
          <PortfolioRefresh leagueMemberId={memberId} />
        )}

        {/* Trading Mode Toggle */}
        {allowOptions && (
          <div className="flex gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setTradingMode("assets")}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-colors flex items-center justify-center gap-2 ${
                tradingMode === "assets"
                  ? "bg-emerald-500 text-black"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Stocks & Crypto</span>
              <span className="sm:hidden">Assets</span>
            </button>
            <button
              onClick={() => setTradingMode("options")}
              className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-colors flex items-center justify-center gap-2 ${
                tradingMode === "options"
                  ? "bg-purple-500 text-white"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <Activity className="w-4 h-4" />
              Options
            </button>
          </div>
        )}

        {tradingMode === "assets" ? (
          <>
            {/* Asset Trading UI */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              {(["all", "stocks", "crypto"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold capitalize transition-colors ${
                    activeTab === tab ? "bg-emerald-500 text-black" : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800"
                  }`}>
                  {tab === "crypto" ? (
                    <span className="flex items-center justify-center gap-2">
                      <Bitcoin className="w-4 h-4" />Crypto
                    </span>
                  ) : tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={activeTab === "crypto" ? "Search crypto..." : "Search stocks..."}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 sm:pl-12 pr-24 py-3 sm:py-4 text-white text-sm sm:text-base placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
                <Button onClick={handleSearch} disabled={loading} size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </div>

            {/* Search Results & Trading Form */}
            {searchResults.length > 0 && (
              <div className="bg-zinc-900/60 rounded-xl border border-zinc-800/60 mb-4 sm:mb-6 overflow-hidden">
                {searchResults.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleSelectAsset(asset)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between hover:bg-zinc-800/60 border-b border-zinc-800/40 last:border-0 transition-colors"
                  >
                    <div className="text-left flex items-center gap-2 sm:gap-3">
                      {asset.type === "crypto" && <Bitcoin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />}
                      <div>
                        <p className="font-bold text-sm sm:text-base">{asset.displaySymbol || asset.symbol}</p>
                        <p className="text-xs sm:text-sm text-zinc-500">{asset.name}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] sm:text-xs px-2 py-1 rounded ${asset.type === "crypto" ? "bg-orange-500/10 text-orange-400" : "bg-sky-500/10 text-sky-400"}`}>
                      {asset.type === "crypto" ? "Crypto" : "Stock"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedAsset && (
              <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/60 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {selectedAsset.type === "crypto" && <Bitcoin className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">{selectedAsset.displaySymbol || selectedAsset.symbol}</h2>
                      <p className="text-zinc-500 text-xs sm:text-sm">{selectedAsset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl sm:text-3xl font-bold">${selectedAsset.price?.toFixed(2)}</p>
                    <p className={`text-xs sm:text-sm ${(selectedAsset.change || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(selectedAsset.change || 0) >= 0 ? "+" : ""}{selectedAsset.change?.toFixed(2)} ({selectedAsset.changePercent?.toFixed(2)}%)
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mb-4 sm:mb-6">
                  <button onClick={() => setTradeType("buy")} className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-colors ${tradeType === "buy" ? "bg-emerald-500 text-black" : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800"}`}>
                    Buy
                  </button>
                  <button onClick={() => setTradeType("sell")} className={`flex-1 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-colors ${tradeType === "sell" ? "bg-red-500 text-white" : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800"}`}>
                    Sell
                  </button>
                </div>

                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm text-zinc-400 mb-2">{selectedAsset.type === "crypto" ? "Amount" : "Shares"}</label>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder="0"
                    min="0"
                    step={selectedAsset.type === "crypto" ? "0.0001" : "0.01"}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-xl sm:text-2xl font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="bg-zinc-800/40 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-zinc-500">Market Price</span>
                    <span>${selectedAsset.price?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg sm:text-xl font-bold">
                    <span>Estimated Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <Button onClick={executeTrade} disabled={loading || !shares || parseFloat(shares) <= 0} size="lg" className={`w-full ${tradeType === "buy" ? "" : "bg-red-500 hover:bg-red-400 shadow-red-500/20"}`}>
                  {loading ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedAsset.displaySymbol || selectedAsset.symbol}`}
                </Button>
              </div>
            )}

            {/* Portfolio & History */}
            <div className="mb-8">
              <HoldingsList holdings={portfolio} />
            </div>
            <TradeHistory trades={trades} />
          </>
        ) : (
          <>
            {/* Options Trading UI */}
            <OptionsChain
              underlyingSymbol="AAPL"
              underlyingPrice={182.50}
              onBuyOption={handleBuyOption}
              cashBalance={cashBalance}
            />
            
            <div className="mt-8">
              <OptionsPositions options={options} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
