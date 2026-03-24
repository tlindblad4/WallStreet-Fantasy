"use client";

import { useEffect, useState } from "react";

interface RealTimePortfolioValueProps {
  initialCash: number;
  holdings: Array<{
    symbol: string;
    shares: number;
    current_price?: number;
    average_cost?: number;
  }>;
  startingBalance: number;
}

export function RealTimePortfolioValue({
  initialCash,
  holdings,
  startingBalance,
}: RealTimePortfolioValueProps) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      const symbols = holdings.map((h) => h.symbol);
      const priceMap: Record<string, number> = {};

      for (const symbol of symbols) {
        try {
          // Map symbol for API
          let apiSymbol = symbol;
          if (symbol === "BTC" || symbol === "BTC-USD") {
            apiSymbol = "BINANCE:BTCUSDT";
          } else if (symbol === "ETH" || symbol === "ETH-USD") {
            apiSymbol = "BINANCE:ETHUSDT";
          }

          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${apiSymbol}&token=d6gttihr01qg85h02hi0d6gttihr01qg85h02hig`
          );
          const data = await response.json();

          if (data.c && data.c > 0) {
            priceMap[symbol] = data.c;
          } else {
            // Fallback to holding's current_price
            const holding = holdings.find((h) => h.symbol === symbol);
            priceMap[symbol] = holding?.current_price || holding?.average_cost || 0;
          }
        } catch (e) {
          console.error(`Failed to fetch ${symbol}:`, e);
          const holding = holdings.find((h) => h.symbol === symbol);
          priceMap[symbol] = holding?.current_price || holding?.average_cost || 0;
        }
      }

      setPrices(priceMap);
      setLoading(false);
    }

    fetchPrices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [holdings]);

  // Calculate values
  const holdingsValue = holdings.reduce((sum, h) => {
    const price = prices[h.symbol] || h.current_price || h.average_cost || 0;
    const value = h.shares * price;
    console.log(`Holding: ${h.symbol}, Shares: ${h.shares}, Price: ${price}, Value: ${value}`);
    return sum + value;
  }, 0);

  const totalValue = initialCash + holdingsValue;
  const totalReturn = totalValue - startingBalance;
  const returnPercent =
    startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;

  console.log('RealTimePortfolioValue:', { 
    holdingsCount: holdings.length, 
    prices, 
    holdingsValue, 
    totalValue,
    startingBalance 
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Portfolio Value</p>
        <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">Cash + Holdings</p>
      </div>
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Cash</p>
        <p className="text-xl font-bold text-emerald-400">
          ${initialCash.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">Available to trade</p>
      </div>
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Return</p>
        <p
          className={`text-xl font-bold ${
            returnPercent >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {returnPercent >= 0 ? "+" : ""}
          {returnPercent.toFixed(1)}%
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ${totalReturn >= 0 ? "+" : ""}
          {totalReturn.toLocaleString()}
        </p>
      </div>
      <div className="bg-white/5 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">Holdings Value</p>
        <p className="text-xl font-bold text-blue-400">
          ${holdingsValue.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {holdings.length} position{holdings.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
