"use client";

import { Trophy, TrendingUp, Users, Clock, DollarSign } from "lucide-react";

export default function LeaguePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] animate-pulse">
      {/* Header Skeleton */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="w-20 h-4 bg-white/10 rounded" />
            <div className="w-32 h-6 bg-white/10 rounded" />
            <div className="w-16 h-4 bg-white/10 rounded" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-4">
              <div className="w-16 h-3 bg-white/10 rounded mb-2" />
              <div className="w-24 h-6 bg-white/10 rounded mb-1" />
              <div className="w-20 h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Days Left Skeleton */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg" />
            <div>
              <div className="w-32 h-5 bg-blue-500/20 rounded mb-1" />
              <div className="w-24 h-3 bg-blue-500/10 rounded" />
            </div>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 h-12 bg-green-500/20 rounded-xl" />
          <div className="flex-1 h-12 bg-white/10 rounded-xl" />
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-48 h-5 bg-white/10 rounded" />
            <div className="w-20 h-8 bg-white/10 rounded" />
          </div>
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>

        {/* Holdings Skeleton */}
        <div className="bg-white/5 rounded-2xl p-6">
          <div className="w-32 h-5 bg-white/10 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
