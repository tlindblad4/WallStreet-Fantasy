"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OptionContract {
  symbol: string;
  underlying: string;
  type: 'call' | 'put';
  strike: number;
  expiration: string;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  inTheMoney: boolean;
}

interface OptionsChainProps {
  underlyingSymbol: string;
  underlyingPrice: number;
  onBuyOption: (option: OptionContract, contracts: number) => void;
  cashBalance: number;
}

export default function OptionsChain({ 
  underlyingSymbol, 
  underlyingPrice, 
  onBuyOption,
  cashBalance 
}: OptionsChainProps) {
  const [selectedExpiration, setSelectedExpiration] = useState<string>("");
  const [options, setOptions] = useState<OptionContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<OptionContract | null>(null);
  const [contracts, setContracts] = useState("1");
  const [expirations, setExpirations] = useState<string[]>([]);

  const loadOptionsChain = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/options/chain?symbol=${underlyingSymbol}&price=${underlyingPrice}`
      );
      const data = await response.json();
      setOptions(data.options || []);
      setExpirations(data.expirations || []);
      if (data.expirations?.length > 0 && !selectedExpiration) {
        setSelectedExpiration(data.expirations[0]);
      }
    } catch (error) {
      console.error("Failed to load options chain:", error);
    }
    setLoading(false);
  };

  // Filter options by selected expiration
  const filteredOptions = options.filter(o => o.expiration === selectedExpiration);
  
  // Group by strike price
  const strikes = [...new Set(filteredOptions.map(o => o.strike))].sort((a, b) => a - b);

  const handleBuy = () => {
    if (selectedOption && contracts) {
      onBuyOption(selectedOption, parseInt(contracts));
      setSelectedOption(null);
      setContracts("1");
    }
  };

  const totalCost = selectedOption ? selectedOption.ask * parseInt(contracts || "0") * 100 : 0;
  const canAfford = totalCost <= cashBalance;

  if (options.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold mb-4">Options Chain - {underlyingSymbol}</h3>
        <p className="text-gray-400 mb-4">Stock Price: ${underlyingPrice.toFixed(2)}</p>
        <Button onClick={loadOptionsChain} disabled={loading} className="bg-green-500 hover:bg-green-600 text-black">
          {loading ? "Loading..." : "Load Options Chain"}
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Options Chain - {underlyingSymbol}</h3>
          <p className="text-sm text-gray-400">Stock Price: ${underlyingPrice.toFixed(2)}</p>
        </div>
        <Button onClick={() => setOptions([])} variant="outline" className="text-sm">
          Change Symbol
        </Button>
      </div>

      {/* Expiration Selector */}
      <div className="mb-6">
        <p className="text-sm text-gray-400 mb-2">Expiration Date</p>
        <div className="flex gap-2 flex-wrap">
          {expirations.map((exp) => (
            <button
              key={exp}
              onClick={() => setSelectedExpiration(exp)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedExpiration === exp
                  ? "bg-green-500 text-black"
                  : "bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {new Date(exp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      </div>

      {/* Options Chain Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-right py-2 px-2">Strike</th>
              <th className="text-right py-2 px-2">Last</th>
              <th className="text-right py-2 px-2">Bid</th>
              <th className="text-right py-2 px-2">Ask</th>
              <th className="text-right py-2 px-2">IV</th>
              <th className="text-center py-2 px-2">ITM</th>
              <th className="text-center py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike) => {
              const call = filteredOptions.find(o => o.strike === strike && o.type === 'call');
              const put = filteredOptions.find(o => o.strike === strike && o.type === 'put');
              
              return (
                <tr key={strike} className="border-b border-white/5 hover:bg-white/5">
                  {/* CALL */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-xs">Call</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono">${strike.toFixed(2)}</td>
                  <td className="text-right py-3 px-2">${call?.lastPrice.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-gray-400">${call?.bid.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-gray-400">${call?.ask.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-xs">{(call?.impliedVolatility || 0 * 100).toFixed(0)}%</td>
                  <td className="text-center py-3 px-2">
                    {call?.inTheMoney ? (
                      <span className="text-green-400 text-xs">✓</span>
                    ) : (
                      <span className="text-gray-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {call && (
                      <button
                        onClick={() => setSelectedOption(call)}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                      >
                        Buy
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* PUTS SECTION */}
        <div className="mt-6 mb-2 text-sm text-gray-400">Put Options</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-white/10">
              <th className="text-left py-2 px-2">Type</th>
              <th className="text-right py-2 px-2">Strike</th>
              <th className="text-right py-2 px-2">Last</th>
              <th className="text-right py-2 px-2">Bid</th>
              <th className="text-right py-2 px-2">Ask</th>
              <th className="text-right py-2 px-2">IV</th>
              <th className="text-center py-2 px-2">ITM</th>
              <th className="text-center py-2 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((strike) => {
              const put = filteredOptions.find(o => o.strike === strike && o.type === 'put');
              
              return (
                <tr key={strike} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-xs">Put</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 font-mono">${strike.toFixed(2)}</td>
                  <td className="text-right py-3 px-2">${put?.lastPrice.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-gray-400">${put?.bid.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-gray-400">${put?.ask.toFixed(2) || '-'}</td>
                  <td className="text-right py-3 px-2 text-xs">{(put?.impliedVolatility || 0 * 100).toFixed(0)}%</td>
                  <td className="text-center py-3 px-2">
                    {put?.inTheMoney ? (
                      <span className="text-green-400 text-xs">✓</span>
                    ) : (
                      <span className="text-gray-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="text-center py-3 px-2">
                    {put && (
                      <button
                        onClick={() => setSelectedOption(put)}
                        className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                      >
                        Buy
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Buy Option Modal */}
      {selectedOption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-xl font-bold mb-4">
              Buy {selectedOption.type === 'call' ? 'Call' : 'Put'} Option
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Underlying</span>
                <span className="font-bold">{selectedOption.underlying}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Strike Price</span>
                <span className="font-bold">${selectedOption.strike.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expiration</span>
                <span>{new Date(selectedOption.expiration).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ask Price</span>
                <span className="font-bold">${selectedOption.ask.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Contracts (x100 shares)</label>
              <input
                type="number"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                min="1"
                max="100"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Premium per Contract</span>
                <span>${selectedOption.ask.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Number of Contracts</span>
                <span>{contracts}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-white/10 pt-2">
                <span>Total Premium</span>
                <span className={canAfford ? "text-white" : "text-red-400"}>
                  ${totalCost.toFixed(2)}
                </span>
              </div>
              {!canAfford && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Insufficient funds (Balance: ${cashBalance.toLocaleString()})
                </p>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Options give you the right to {selectedOption.type === 'call' ? 'buy' : 'sell'} 
                  {parseInt(contracts) * 100} shares of {selectedOption.underlying} at ${selectedOption.strike.toFixed(2)} 
                  until expiration. Options expire worthless if not in-the-money.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedOption(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBuy}
                disabled={!canAfford || loading}
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
              >
                Buy {contracts} Contract{parseInt(contracts) > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
