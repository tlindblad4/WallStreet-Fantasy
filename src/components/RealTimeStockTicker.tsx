"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockTickerProps {
  symbol: string;
  initialPrice: number;
  change: number;
  changePercent: number;
}

export default function RealTimeStockTicker({ 
  symbol, 
  initialPrice, 
  change, 
  changePercent 
}: StockTickerProps) {
  const [price, setPrice] = useState(initialPrice);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    // Simulate real-time price updates (in production, this would be WebSocket)
    const interval = setInterval(() => {
      const volatility = 0.002; // 0.2% volatility
      const change = (Math.random() - 0.5) * volatility * price;
      const newPrice = Math.max(0.01, price + change);
      
      if (newPrice > price) {
        setFlash("up");
      } else if (newPrice < price) {
        setFlash("down");
      }
      
      setPrice(newPrice);
      
      setTimeout(() => setFlash(null), 500);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [price]);

  const isPositive = change >= 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold">{symbol}</h3>
          <p className="text-sm text-zinc-500">Real-time Price</p>
        </div>
        <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
          {isPositive ? (
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-400" />
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <motion.span
          key={price}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={`text-4xl font-bold ${
            flash === "up" ? 'text-emerald-400' : flash === "down" ? 'text-red-400' : ''
          }`}
        >
          ${price.toFixed(2)}
        </motion.span>
        <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change.toFixed(2)} ({changePercent.toFixed(2)}%)
        </span>
      </div>

      {/* Price change indicator */}
      {flash && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mt-2 text-sm ${flash === "up" ? 'text-emerald-400' : 'text-red-400'}`}
        >
          Price {flash === "up" ? 'increased' : 'decreased'} just now
        </motion.div>
      )}
    </div>
  );
}
