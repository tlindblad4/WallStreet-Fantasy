"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";

interface OptionContract {
  id: string;
  underlying_symbol: string;
  option_type: 'call' | 'put';
  strike_price: number;
  expiration_date: string;
  contracts: number;
  premium_paid: number;
  total_premium: number;
  status: 'active' | 'exercised' | 'expired' | 'closed';
  exercised_at?: string;
  exercise_profit?: number;
  created_at: string;
}

interface OptionsPositionsProps {
  options: OptionContract[];
  currentPrices?: Record<string, number>;
}

export default function OptionsPositions({ options, currentPrices = {} }: OptionsPositionsProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  const filteredOptions = options.filter((opt) => {
    if (filter === 'all') return true;
    if (filter === 'active') return opt.status === 'active';
    if (filter === 'closed') return ['exercised', 'expired', 'closed'].includes(opt.status);
    return true;
  });

  // Sort: active first, then by expiration date
  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
  });

  const totalPremiumPaid = options
    .filter(o => o.status === 'active')
    .reduce((sum, o) => sum + o.total_premium, 0);

  const activeContracts = options.filter(o => o.status === 'active').length;

  if (options.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Options Positions</h3>
        <p className="text-gray-400 text-sm">
          Start trading options to build your options portfolio. Options provide leverage and hedging opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Options Positions</h3>
          <p className="text-sm text-gray-400">
            {activeContracts} active contract{activeContracts !== 1 ? 's' : ''} · 
            ${totalPremiumPaid.toLocaleString()} in premium
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'active', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-white/5"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        {sortedOptions.map((option) => {
          const isCall = option.option_type === 'call';
          const currentPrice = currentPrices[option.underlying_symbol] || 0;
          const isExpired = new Date(option.expiration_date) < new Date();
          const daysToExpiry = Math.ceil(
            (new Date(option.expiration_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          
          // Calculate intrinsic value
          let intrinsicValue = 0;
          if (currentPrice > 0) {
            if (isCall) {
              intrinsicValue = Math.max(0, currentPrice - option.strike_price);
            } else {
              intrinsicValue = Math.max(0, option.strike_price - currentPrice);
            }
          }
          
          const currentValue = intrinsicValue * option.contracts * 100;
          const pnl = option.status === 'exercised' 
            ? (option.exercise_profit || 0)
            : currentValue - option.total_premium;
          const isProfitable = pnl > 0;

          return (
            <div
              key={option.id}
              className={`bg-white/5 rounded-xl p-4 border-l-4 ${
                option.status === 'active' 
                  ? isCall ? 'border-l-green-500' : 'border-l-red-500'
                  : option.status === 'exercised' && option.exercise_profit && option.exercise_profit > 0
                    ? 'border-l-green-500'
                    : 'border-l-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isCall ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{option.underlying_symbol}</p>
                    <p className="text-xs text-gray-400">
                      {option.option_type.toUpperCase()} · {option.contracts} contract{option.contracts > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded ${
                    option.status === 'active' 
                      ? 'bg-green-500/20 text-green-400'
                      : option.status === 'exercised'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {option.status.charAt(0).toUpperCase() + option.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-400 text-xs">Strike</p>
                  <p className="font-mono">${option.strike_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Expiration</p>
                  <div className="flex items-center gap-1">
                    <p>{new Date(option.expiration_date).toLocaleDateString()}</p>
                    {option.status === 'active' && daysToExpiry <= 7 && (
                      <Clock className="w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Premium Paid</p>
                  <p>${option.total_premium.toLocaleString()}</p>
                </div>
              </div>

              {option.status === 'active' && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div>
                    <p className="text-xs text-gray-400">Current Value</p>
                    <p className="font-semibold">${currentValue.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">P&L</p>
                    <p className={`font-semibold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                      {isProfitable ? '+' : ''}${pnl.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {option.status === 'exercised' && (
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <p className="text-sm text-gray-400">Exercise Result</p>
                  <p className={`font-semibold ${(option.exercise_profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(option.exercise_profit || 0) >= 0 ? '+' : ''}${(option.exercise_profit || 0).toLocaleString()}
                  </p>
                </div>
              )}

              {option.status === 'expired' && (
                <div className="flex items-center gap-2 pt-3 border-t border-white/10 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">Expired worthless</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Options Info */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Options expire automatically on the expiration date. In-the-money options are exercised at expiration. 
            Each contract represents 100 shares of the underlying stock.
          </p>
        </div>
      </div>
    </div>
  );
}
