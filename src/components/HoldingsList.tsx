"use client";

import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";

interface Holding {
  symbol: string;
  company_name?: string;
  shares: number;
  average_cost: number;
  current_price?: number;
  current_value?: number;
  unrealized_gain_loss?: number;
  unrealized_gain_loss_percent?: number;
  last_updated?: string;
}

interface HoldingsListProps {
  holdings: Holding[];
  onSelect?: (holding: Holding) => void;
}

export default function HoldingsList({ holdings, onSelect }: HoldingsListProps) {
  // Sort by current value (descending)
  const sortedHoldings = [...holdings].sort(
    (a, b) => (b.current_value || 0) - (a.current_value || 0)
  );

  // Calculate totals
  const totalValue = sortedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCost = sortedHoldings.reduce((sum, h) => sum + (h.shares * h.average_cost), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  if (holdings.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-12 text-center">
        <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
        <p className="text-gray-400">Start trading to build your portfolio</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Your Holdings</h3>
          <p className="text-sm text-gray-400">{holdings.length} positions</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total Value</p>
          <p className="text-xl font-bold">${totalValue.toLocaleString()}</p>
          <p className={`text-sm ${totalGainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString()} ({totalGainLossPercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="space-y-3">
        {sortedHoldings.map((holding) => {
          const gainLoss = holding.unrealized_gain_loss || 0;
          const gainLossPercent = holding.unrealized_gain_loss_percent || 0;
          const isPositive = gainLoss >= 0;
          const currentPrice = holding.current_price || holding.average_cost;
          const currentValue = holding.current_value || (holding.shares * currentPrice);
          const costBasis = holding.shares * holding.average_cost;

          return (
            <div
              key={holding.symbol}
              onClick={() => onSelect?.(holding)}
              className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                {/* Left: Symbol & Shares */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPositive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{holding.symbol}</p>
                    <p className="text-sm text-gray-400">
                      {holding.shares} {holding.shares === 1 ? 'share' : 'shares'}
                    </p>
                  </div>
                </div>

                {/* Center: Price Info (hidden on mobile) */}
                <div className="hidden md:block text-center">
                  <p className="text-sm">${currentPrice.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">
                    Avg: ${holding.average_cost.toFixed(2)}
                  </p>
                </div>

                {/* Right: Value & Gain/Loss */}
                <div className="text-right">
                  <p className="font-semibold">${currentValue.toLocaleString()}</p>
                  <div className={`flex items-center justify-end gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isPositive ? '+' : ''}${gainLoss.toLocaleString()}</span>
                    <span className="text-xs">({isPositive ? '+' : ''}{gainLossPercent.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar showing position size */}
              <div className="mt-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min((currentValue / totalValue) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((currentValue / totalValue) * 100).toFixed(1)}% of portfolio
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset Allocation Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-sm font-semibold mb-4">Asset Allocation</h4>
        <div className="flex h-2 rounded-full overflow-hidden">
          {sortedHoldings.map((holding, index) => {
            const percentage = ((holding.current_value || 0) / totalValue) * 100;
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
            return (
              <div
                key={holding.symbol}
                className={colors[index % colors.length]}
                style={{ width: `${percentage}%` }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {sortedHoldings.slice(0, 5).map((holding, index) => {
            const percentage = ((holding.current_value || 0) / totalValue) * 100;
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
            return (
              <div key={holding.symbol} className="flex items-center gap-1.5 text-xs">
                <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-gray-400">{holding.symbol}</span>
                <span className="font-medium">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
          {sortedHoldings.length > 5 && (
            <span className="text-xs text-gray-500">+{sortedHoldings.length - 5} more</span>
          )}
        </div>
      </div>
    </div>
  );
}

export type { Holding };
