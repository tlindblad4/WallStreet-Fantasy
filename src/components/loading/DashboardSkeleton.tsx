"use client";

import { motion } from "framer-motion";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header Skeleton */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="w-32 h-8 bg-white/10 rounded-lg animate-pulse" />
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full animate-pulse" />
              <div className="w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Skeleton */}
        <div className="mb-8">
          <div className="w-48 h-10 bg-white/10 rounded-lg animate-pulse mb-2" />
          <div className="w-64 h-5 bg-white/10 rounded-lg animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-2" />
                  <div className="w-32 h-8 bg-white/10 rounded animate-pulse mb-1" />
                  <div className="w-20 h-3 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Market Overview Skeleton */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
            <div className="w-32 h-6 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-zinc-800/50 rounded-xl p-4">
                <div className="w-16 h-3 bg-white/10 rounded animate-pulse mb-2" />
                <div className="w-20 h-6 bg-white/10 rounded animate-pulse mb-1" />
                <div className="w-12 h-3 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Achievements Skeleton */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-white/10 rounded animate-pulse" />
            <div className="w-32 h-6 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-zinc-800/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg animate-pulse" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-white/10 rounded animate-pulse mb-1" />
                    <div className="w-32 h-3 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-white/10 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leagues Skeleton */}
        <div>
          <div className="w-32 h-8 bg-white/10 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
                    <div>
                      <div className="w-32 h-5 bg-white/10 rounded animate-pulse mb-1" />
                      <div className="w-20 h-3 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="w-24 h-3 bg-white/10 rounded animate-pulse mb-1" />
                  <div className="w-32 h-7 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                  <div className="h-full w-2/3 bg-white/10 rounded-full animate-pulse" />
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="w-20 h-4 bg-white/10 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
