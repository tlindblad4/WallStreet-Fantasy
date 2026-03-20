"use client";

import { useMemo } from "react";
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface Holding {
  symbol: string;
  shares: number;
  average_cost: number;
  current_price?: number;
  current_value?: number;
  unrealized_gain_loss_percent?: number;
}

interface RiskAnalysisProps {
  holdings: Holding[];
  cashBalance: number;
  totalValue: number;
}

export default function RiskAnalysis({ holdings, cashBalance, totalValue }: RiskAnalysisProps) {
  const analysis = useMemo(() => {
    if (holdings.length === 0) {
      return {
        riskLevel: 'Low',
        riskColor: 'text-emerald-400',
        riskBg: 'bg-emerald-500/10',
        concentrationRisk: 0,
        diversificationScore: 0,
        cashPercentage: 100,
        volatilityScore: 0,
      };
    }

    // Calculate concentration risk (largest position %)
    const largestPosition = Math.max(...holdings.map(h => h.current_value || 0));
    const concentrationRisk = (largestPosition / totalValue) * 100;

    // Calculate diversification score (0-100)
    // More positions = better diversification, up to a point
    const positionCount = holdings.length;
    const diversificationScore = Math.min(100, positionCount * 15);

    // Cash percentage
    const cashPercentage = (cashBalance / totalValue) * 100;

    // Volatility score based on gains/losses variance
    const returns = holdings.map(h => h.unrealized_gain_loss_percent || 0);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatilityScore = Math.min(100, Math.sqrt(variance) * 2);

    // Overall risk level
    let riskLevel = 'Moderate';
    let riskColor = 'text-yellow-400';
    let riskBg = 'bg-yellow-500/10';

    const riskFactors = [
      concentrationRisk > 40, // High concentration
      diversificationScore < 30, // Poor diversification
      cashPercentage < 10, // Low cash
      volatilityScore > 50, // High volatility
    ];

    const riskCount = riskFactors.filter(Boolean).length;

    if (riskCount === 0) {
      riskLevel = 'Low';
      riskColor = 'text-emerald-400';
      riskBg = 'bg-emerald-500/10';
    } else if (riskCount >= 3) {
      riskLevel = 'High';
      riskColor = 'text-red-400';
      riskBg = 'bg-red-500/10';
    }

    return {
      riskLevel,
      riskColor,
      riskBg,
      concentrationRisk,
      diversificationScore,
      cashPercentage,
      volatilityScore,
    };
  }, [holdings, cashBalance, totalValue]);

  const getRiskAdvice = () => {
    const advice = [];
    
    if (analysis.concentrationRisk > 40) {
      advice.push(`Your largest position is ${analysis.concentrationRisk.toFixed(1)}% of portfolio. Consider diversifying.`);
    }
    
    if (analysis.diversificationScore < 30) {
      advice.push(`You only have ${holdings.length} position${holdings.length !== 1 ? 's' : ''}. Consider adding more stocks for better diversification.`);
    }
    
    if (analysis.cashPercentage < 10) {
      advice.push(`You're using ${(100 - analysis.cashPercentage).toFixed(1)}% of your portfolio. Keep some cash for opportunities.`);
    }
    
    if (analysis.volatilityScore > 50) {
      advice.push(`Your portfolio is showing high volatility. Consider more stable investments.`);
    }
    
    if (advice.length === 0) {
      advice.push("Your portfolio looks well-balanced!");
    }
    
    return advice;
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-emerald-400" />
        <h3 className="text-lg font-semibold">Risk Analysis</h3>
      </div>

      {/* Risk Level Badge */}
      <div className={`${analysis.riskBg} border ${analysis.riskColor.replace('text', 'border')} rounded-xl p-4 mb-4`}>
        <div className="flex items-center gap-3">
          {analysis.riskLevel === 'High' ? (
            <AlertTriangle className={`w-8 h-8 ${analysis.riskColor}`} />
          ) : analysis.riskLevel === 'Low' ? (
            <Shield className={`w-8 h-8 ${analysis.riskColor}`} />
          ) : (
            <Activity className={`w-8 h-8 ${analysis.riskColor}`} />
          )}
          <div>
            <p className={`text-sm ${analysis.riskColor}`}>Risk Level</p>
            <p className={`text-2xl font-bold ${analysis.riskColor}`}>{analysis.riskLevel}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-zinc-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Concentration</span>
          </div>
          <p className="text-lg font-semibold">{analysis.concentrationRisk.toFixed(1)}%</p>
          <p className="text-xs text-zinc-600">Largest position</p>
        </div>

        <div className="bg-zinc-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Diversification</span>
          </div>
          <p className="text-lg font-semibold">{analysis.diversificationScore.toFixed(0)}/100</p>
          <p className="text-xs text-zinc-600">Portfolio spread</p>
        </div>

        <div className="bg-zinc-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Cash Reserve</span>
          </div>
          <p className="text-lg font-semibold">{analysis.cashPercentage.toFixed(1)}%</p>
          <p className="text-xs text-zinc-600">Available cash</p>
        </div>

        <div className="bg-zinc-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-zinc-500" />
            <span className="text-xs text-zinc-500">Volatility</span>
          </div>
          <p className="text-lg font-semibold">{analysis.volatilityScore.toFixed(0)}/100</p>
          <p className="text-xs text-zinc-600">Price swings</p>
        </div>
      </div>

      {/* Advice Section */}
      <div className="bg-zinc-800/30 rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Recommendations</p>
        <ul className="space-y-2">
          {getRiskAdvice().map((tip, index) => (
            <li key={index} className="text-sm text-zinc-400 flex items-start gap-2">
              <span className="text-emerald-400 mt-1">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
