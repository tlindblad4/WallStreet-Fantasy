"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  cashBalance: number;
}

export default function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  symbol,
  type,
  quantity,
  price,
  total,
  cashBalance,
}: TradeConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    await onConfirm();
    setIsProcessing(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const isBuy = type === "buy";
  const canAfford = isBuy ? cashBalance >= total : true;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={!isProcessing ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className={`p-6 ${isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isBuy ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {isBuy ? (
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Confirm {isBuy ? 'Purchase' : 'Sale'}
                      </h3>
                      <p className="text-zinc-400">{symbol}</p>
                    </div>
                  </div>
                  {!isProcessing && (
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {isSuccess ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400">Trade Executed!</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Trade Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Quantity</span>
                        <span className="font-semibold">{quantity} shares</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Price per share</span>
                        <span className="font-semibold">${price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Total {isBuy ? 'Cost' : 'Proceeds'}</span>
                        <span className={`font-bold text-lg ${isBuy ? 'text-red-400' : 'text-emerald-400'}`}>
                          ${total.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Cash Balance After</span>
                        <span className="font-semibold">
                          ${(isBuy ? cashBalance - total : cashBalance + total).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Warning */}
                    {!canAfford && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">
                          Insufficient funds. You need ${total.toLocaleString()} but only have ${cashBalance.toLocaleString()}.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirm}
                        disabled={isProcessing || !canAfford}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                          isBuy
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-black'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? (
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        ) : (
                          `Confirm ${isBuy ? 'Buy' : 'Sell'}`
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
