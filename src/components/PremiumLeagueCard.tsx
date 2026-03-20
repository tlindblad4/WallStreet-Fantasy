"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Users, ArrowRight } from "lucide-react";
import { GlassCard } from "./PremiumCards";
import { PremiumButton, PremiumBadge, PremiumAvatar, PremiumProgressBar } from "./PremiumElements";
import { FadeIn } from "../animations/FadeIn";

interface PremiumLeagueCardProps {
  membership: {
    id: string;
    league: {
      id: string;
      name: string;
      status: string;
      commissioner_id: string;
    };
    calculatedTotalValue: number;
    calculatedReturn: number;
    calculatedReturnPercent: number;
    current_rank: number;
    holdingsValue: number;
    cash_balance: number;
  };
  currentUserId: string;
}

export function PremiumLeagueCard({ membership, currentUserId }: PremiumLeagueCardProps) {
  const league = membership.league;
  const isCommissioner = league.commissioner_id === currentUserId;
  const isPositive = membership.calculatedReturn >= 0;

  return (
    <FadeIn>
      <Link href={`/leagues/${league.id}`}>
        <GlassCard className="p-6 h-full cursor-pointer group">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg group-hover:text-emerald-400 transition-colors">
                  {league.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <PremiumBadge variant={isPositive ? "success" : "error"}>
                    {isPositive ? "Profitable" : "Down"}
                  </PremiumBadge>
                  {isCommissioner && (
                    <PremiumBadge variant="info">Commissioner</PremiumBadge>
                  )}
                </div>
              </div>
            </div>
            
            <motion.div
              className="p-2 rounded-lg bg-white/5 group-hover:bg-emerald-500/20 transition-colors"
              whileHover={{ x: 5 }}
            >
              <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400" />
            </motion.div>
          </div>

          {/* Portfolio Value */}
          <div className="mb-4">
            <p className="text-sm text-zinc-500 mb-1">Portfolio Value</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                ${membership.calculatedTotalValue.toLocaleString()}
              </span>
              <span className={`text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{membership.calculatedReturnPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-2">
              <span>Cash: ${membership.cash_balance.toLocaleString()}</span>
              <span>Holdings: ${membership.holdingsValue.toLocaleString()}</span>
            </div>
            <PremiumProgressBar 
              value={membership.holdingsValue} 
              max={membership.calculatedTotalValue}
              size="sm"
              showValue={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-400">Rank #{membership.current_rank || '-'}</span>
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>${Math.abs(membership.calculatedReturn).toLocaleString()}</span>
            </div>
          </div>
        </GlassCard>
      </Link>
    </FadeIn>
  );
}
