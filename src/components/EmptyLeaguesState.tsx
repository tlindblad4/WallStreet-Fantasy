"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Plus, Users, ArrowRight } from "lucide-react";
import { GlassCard } from "./ui/PremiumCards";
import { PremiumButton } from "./ui/PremiumElements";

export default function EmptyLeaguesState() {
  return (
    <GlassCard className="p-12 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12 text-emerald-400" />
        </div>
        
        <h2 className="text-2xl font-bold mb-3">Welcome to WallStreet Fantasy!</h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto">
          Start your trading journey by creating your first league or joining an existing one. 
          Compete with friends and climb the leaderboard!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/leagues/create">
            <PremiumButton variant="primary" icon={<Plus className="w-4 h-4" />}>
              Create Your First League
            </PremiumButton>
          </Link>
          
          <Link href="/leagues/join">
            <PremiumButton variant="secondary" icon={<Users className="w-4 h-4" />}>
              Join a League
            </PremiumButton>
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-sm text-zinc-500 mb-4">New to trading? Here's what you can do:</p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">📈</div>
              <h4 className="font-semibold mb-1">Trade Stocks</h4>
              <p className="text-xs text-zinc-500">Buy and sell stocks with virtual money</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🏆</div>
              <h4 className="font-semibold mb-1">Compete</h4>
              <p className="text-xs text-zinc-500">Climb the leaderboard against friends</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold mb-1">Achievements</h4>
              <p className="text-xs text-zinc-500">Unlock badges as you trade</p>
            </div>
          </div>
        </div>
      </motion.div>
    </GlassCard>
  );
}
