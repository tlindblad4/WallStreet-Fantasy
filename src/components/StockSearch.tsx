"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2, TrendingUp, TrendingDown } from "lucide-react";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

interface StockSearchProps {
  onSelect: (symbol: string) => void;
  placeholder?: string;
}

export default function StockSearch({ onSelect, placeholder = "Search stocks..." }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchStocks(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchStocks = async (searchQuery: string) => {
    setLoading(true);
    try {
      // Search for symbols
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(searchQuery)}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();

      if (data.result && data.result.length > 0) {
        // Get prices for top results
        const topResults = data.result.slice(0, 5);
        const resultsWithPrices = await Promise.all(
          topResults.map(async (item: any) => {
            try {
              const quoteResponse = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`
              );
              const quote = await quoteResponse.json();
              
              return {
                symbol: item.symbol,
                name: item.description,
                type: item.type,
                price: quote.c,
                change: quote.d,
                changePercent: quote.dp,
              };
            } catch {
              return {
                symbol: item.symbol,
                name: item.description,
                type: item.type,
              };
            }
          })
        );
        
        setResults(resultsWithPrices);
        setShowResults(true);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (results.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl z-50">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelect(result.symbol)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0"
                >
                  <div className="text-left">
                    <p className="font-semibold text-white">{result.symbol}</p>
                    <p className="text-sm text-zinc-500 truncate max-w-[200px]">{result.name}</p>
                  </div>
                  {result.price ? (
                    <div className="text-right">
                      <p className="font-medium">${result.price.toFixed(2)}</p>
                      <div className={`flex items-center gap-1 text-sm ${(result.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(result.changePercent || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{(result.changePercent || 0) >= 0 ? '+' : ''}{result.changePercent?.toFixed(2)}%</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600 uppercase">{result.type}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
