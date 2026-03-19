"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalValue: number;
  cashBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get league info
      const { data: league } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueId)
        .single();

      if (league) {
        setLeagueName(league.name);
      }

      // Get all members with their portfolio values
      const { data: members } = await supabase
        .from("league_members")
        .select(`
          id,
          user_id,
          cash_balance,
          total_value,
          current_rank,
          profiles:user_id(username)
        `)
        .eq("league_id", leagueId)
        .eq("status", "active");

      if (members) {
        // Get holdings for each member
        const memberIds = members.map(m => m.id);
        const { data: holdings } = await supabase
          .from("portfolio_holdings")
          .select("league_member_id, current_value")
          .in("league_member_id", memberIds);

        // Calculate actual values
        const entries: LeaderboardEntry[] = members.map((member: any) => {
          const memberHoldings = holdings?.filter(h => h.league_member_id === member.id) || [];
          const holdingsValue = memberHoldings.reduce((sum: number, h: any) => sum + (h.current_value || 0), 0);
          const totalValue = (member.cash_balance || 0) + holdingsValue;
          const startingBalance = 100000; // Default starting balance
          const totalReturn = totalValue - startingBalance;
          const totalReturnPercent = startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;

          return {
            rank: member.current_rank || 0,
            userId: member.user_id,
            username: member.profiles?.username || "Unknown",
            totalValue,
            cashBalance: member.cash_balance || 0,
            totalReturn,
            totalReturnPercent,
            isCurrentUser: member.user_id === user?.id,
          };
        });

        // Sort by total value descending
        entries.sort((a, b) => b.totalValue - a.totalValue);
        
        // Update ranks
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [leagueId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-zinc-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-zinc-500">#{rank}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/leagues/${leagueId}`} className="text-zinc-400 hover:text-white flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-xl font-bold">Leaderboard</h1>
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{leagueName}</h2>
          <p className="text-zinc-500">Top performers ranked by portfolio value</p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={`p-4 rounded-xl border transition-all ${
                entry.isCurrentUser
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {entry.username}
                      {entry.isCurrentUser && (
                        <span className="ml-2 text-xs text-emerald-400">(You)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-500">
                    ${entry.totalValue.toLocaleString()}
                  </p>
                </div>

                {/* Return */}
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${entry.totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.totalReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="font-semibold">
                      {entry.totalReturn >= 0 ? '+' : ''}{entry.totalReturnPercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {entry.totalReturn >= 0 ? '+' : ''}${entry.totalReturn.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No members in this league yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
