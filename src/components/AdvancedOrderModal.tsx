"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Target, TrendingDown, X } from "lucide-react";

interface AdvancedOrderModalProps {
  symbol: string;
  currentPrice: number;
  leagueMemberId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type OrderType = 'limit_buy' | 'limit_sell' | 'stop_loss';

export default function AdvancedOrderModal({
  symbol,
  currentPrice,
  leagueMemberId,
  onClose,
  onSuccess,
}: AdvancedOrderModalProps) {
  const [orderType, setOrderType] = useState<OrderType>('limit_buy');
  const [quantity, setQuantity] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      
      const { error: submitError } = await supabase
        .from("pending_orders")
        .insert({
          league_member_id: leagueMemberId,
          symbol,
          order_type: orderType,
          quantity: parseFloat(quantity),
          target_price: parseFloat(targetPrice),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

      if (submitError) throw submitError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const getOrderDescription = () => {
    switch (orderType) {
      case 'limit_buy':
        return `Buy ${quantity || 'X'} shares when price drops to $${targetPrice || 'X'} or lower`;
      case 'limit_sell':
        return `Sell ${quantity || 'X'} shares when price rises to $${targetPrice || 'X'} or higher`;
      case 'stop_loss':
        return `Sell ${quantity || 'X'} shares to limit losses if price drops to $${targetPrice || 'X'} or lower`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Advanced Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-zinc-400 text-sm">{symbol}</p>
          <p className="text-2xl font-bold">${currentPrice.toFixed(2)}</p>
        </div>

        {/* Order Type Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => setOrderType('limit_buy')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              orderType === 'limit_buy'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Target className="w-4 h-4 mx-auto mb-1" />
            Limit Buy
          </button>
          <button
            onClick={() => setOrderType('limit_sell')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              orderType === 'limit_sell'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <Target className="w-4 h-4 mx-auto mb-1" />
            Limit Sell
          </button>
          <button
            onClick={() => setOrderType('stop_loss')}
            className={`p-3 rounded-xl text-sm font-medium transition-colors ${
              orderType === 'stop_loss'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <TrendingDown className="w-4 h-4 mx-auto mb-1" />
            Stop Loss
          </button>
        </div>

        {orderType === 'stop_loss' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">
                Stop-loss orders help limit your losses. Your shares will be sold automatically if the price drops to your target.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              placeholder="0"
              min="1"
              step="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              {orderType === 'limit_buy' ? 'Buy when price drops to' :
               orderType === 'limit_sell' ? 'Sell when price rises to' :
               'Sell if price drops to'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Current: ${currentPrice.toFixed(2)}
            </p>
          </div>

          {/* Order Preview */}
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <p className="text-sm text-zinc-400 mb-1">Order Preview</p>
            <p className="text-sm">{getOrderDescription()}</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !quantity || !targetPrice}
          >
            {loading ? 'Creating Order...' : 'Place Order'}
          </Button>
        </form>
      </div>
    </div>
  );
}
