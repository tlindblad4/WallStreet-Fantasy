"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Search, DollarSign, Bitcoin } from "lucide-react";

interface Asset {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: "stock" | "crypto";
}

// Popular crypto for quick access
const POPULAR_CRYPTO = [
  { symbol: "BINANCE:BTCUSDT", displaySymbol: "BTC", description: "Bitcoin", type: "crypto" },
  { symbol: "BINANCE:ETHUSDT", displaySymbol: "ETH", description: "Ethereum", type: "crypto" },
  { symbol: "BINANCE:SOLUSDT", displaySymbol: "SOL", description: "Solana", type: "crypto" },
  { symbol: "BINANCE:ADAUSDT", displaySymbol: "ADA", description: "Cardano", type: "crypto" },
  { symbol: "BINANCE:DOTUSDT", displaySymbol: "DOT", description: "Polkadot", type: "crypto" },
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
  const [activeTab, setActiveTab] = useState<"all" | "stocks" | "crypto">("all");
  
  const supabase = createClient();

  // Load portfolio data
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
        
        const { data: holdings } = await supabase
          .from("portfolio_holdings")
          .select("*")
          .eq("league_member_id", member.id);
        
        setPortfolio(holdings || []);
      }
    };

    loadPortfolio();
  }, [leagueId, supabase]);

  const handleSearch = async () => {
    setLoading(true);
    
    let results: Asset[] = [];

    if (activeTab === "all" || activeTab === "stocks") {
      // Search stocks
      if (searchQuery.trim()) {
        const response = await fetch(`/api/stocks/search?q=${searchQuery}&type=stock`);
        const data = await response.json();
        results = [...results, ...(data.results || []).map((r: any) => ({ ...r, type: "stock" }))];
      }
    }

    if (activeTab === "all" || activeTab === "crypto") {
      // Search crypto
      if (searchQuery.trim()) {
        const response = await fetch(`/api/stocks/search?q=${searchQuery}&type=crypto`);
        const data = await response.json();
        results = [...results, ...(data.results || []).map((r: any) => ({ ...r, type: "crypto" }))];
      } else if (activeTab === "crypto") {
        // Show popular crypto if no search
        results = POPULAR_CRYPTO.map(c => ({ ...c, name: c.description, price: 0, change: 0, changePercent: 0, type: "crypto" as const }));
      }
    }

    setSearchResults(results);
    setLoading(false);
  };

  // Load popular crypto on tab switch
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
      // Reload portfolio
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

  const total = selectedAsset ? selectedAsset.price * (parseFloat(shares) || 0) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/leagues/${leagueId}`} className="text-gray-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Trade</h1>
            <div className="text-right">
              <p className="text-sm text-gray-400">Buying Power</p>
              <p className="text-xl font-bold text-green-400">${cashBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all", "stocks", "crypto"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "bg-green-500 text-black"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {tab === "crypto" ? (
                <span className="flex items-center justify-center gap-2">
                  <Bitcoin className="w-4 h-4" />
                  Crypto
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder={activeTab === "crypto" ? "Search crypto (e.g. BTC, ETH)" : "Search stocks (e.g. AAPL, TSLA)"}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 text-black"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-white/5 rounded-2xl border border-white/10 mb-6 overflow-hidden">
            {searchResults.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleSelectAsset(asset)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0"
              >
                <div className="text-left flex items-center gap-3">
                  {asset.type === "crypto" && <Bitcoin className="w-5 h-5 text-orange-400" />}
                  <div>
                    <p className="font-bold">{asset.displaySymbol || asset.symbol}</p>
                    <p className="text-sm text-gray-400">{asset.name}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${asset.type === "crypto" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {asset.type === "crypto" ? "Crypto" : "Stock"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Selected Asset */}
        {selectedAsset && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {selectedAsset.type === "crypto" && <Bitcoin className="w-8 h-8 text-orange-400" />}
                <div>
                  <h2 className="text-2xl font-bold">{selectedAsset.displaySymbol || selectedAsset.symbol}</h2>
                  <p className="text-gray-400">{selectedAsset.name}</p>
                  <span className={`text-xs px-2 py-1 rounded ${selectedAsset.type === "crypto" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {selectedAsset.type === "crypto" ? "Cryptocurrency" : "Stock"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${selectedAsset.price?.toFixed(2)}</p>
                <p className={`text-sm ${(selectedAsset.change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(selectedAsset.change || 0) >= 0 ? "+" : ""}{selectedAsset.change?.toFixed(2)} ({selectedAsset.changePercent?.toFixed(2)}%)
                </p>
              </div>
            </div>

            {/* Trade Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setTradeType("buy")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  tradeType === "buy"
                    ? "bg-green-500 text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType("sell")}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  tradeType === "sell"
                    ? "bg-red-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Sell
              </button>
            </div>

            {/* Shares Input */}
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">
                {selectedAsset.type === "crypto" ? "Amount" : "Shares"}
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                min="0"
                step={selectedAsset.type === "crypto" ? "0.0001" : "0.01"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Market Price</span>
                <span>${selectedAsset.price?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Estimated Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}

            <Button
              onClick={executeTrade}
              disabled={loading || !shares || parseFloat(shares) <= 0}
              className={`w-full py-4 rounded-xl font-bold text-lg ${
                tradeType === "buy"
                  ? "bg-green-500 hover:bg-green-600 text-black"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {loading ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedAsset.displaySymbol || selectedAsset.symbol}`}
            </Button>
          </div>
        )}

        {/* Portfolio */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Portfolio</h3>
          {portfolio.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No holdings yet. Start trading!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {portfolio.map((holding) => (
                <div
                  key={holding.symbol}
                  className="bg-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${holding.symbol.length <= 4 ? "bg-orange-400" : "bg-blue-400"}`} />
                    <div>
                      <p className="font-bold">{holding.symbol}</p>
                      <p className="text-sm text-gray-400">{holding.shares} shares</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${holding.current_value?.toFixed(2)}</p>
                    <p className={`text-sm ${(holding.unrealized_gain_loss || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {(holding.unrealized_gain_loss || 0) >= 0 ? "+" : ""}${holding.unrealized_gain_loss?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
