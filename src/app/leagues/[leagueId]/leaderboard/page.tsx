"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_value: number;
  total_return_percent: number;
  isMe: boolean;
}

export default function LeaderboardPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  
  const [members, setMembers] = useState<LeaderboardEntry[]>([]);
  const [leagueName, setLeagueName] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!leagueId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: league } = await supabase
        .from("leagues")
        .select("name")
        .eq("id", leagueId)
        .single();
      
      if (league) setLeagueName(league.name);

      const { data: membersData } = await supabase
        .from("league_members")
        .select(`
          current_rank,
          total_value,
          total_return_percent,
          user_id,
          profiles:user_id (username)
        `)
        .eq("league_id", leagueId)
        .eq("status", "active")
        .order("current_rank", { ascending: true });

      if (membersData) {
        const formatted = membersData.map((m: any) => ({
          rank: m.current_rank || 0,
          user_id: m.user_id,
          username: m.profiles?.username || "Unknown",
          total_value: m.total_value || 0,
          total_return_percent: m.total_return_percent || 0,
          isMe: m.user_id === user?.id,
        }));
        setMembers(formatted);
      }
      
      setLoading(false);
    };

    loadLeaderboard();
  }, [leagueId, supabase]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={`/leagues/${leagueId}`} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">Leaderboard</h1>
              <p className="text-xs sm:text-sm text-zinc-500 truncate">{leagueName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {members.map((member, index) => (
              <div
                key={member.user_id}
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 ${
                  member.isMe
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-zinc-900/60 border border-zinc-800/60"
                }`}
              >
                {/* Rank */}
                <div className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-sm sm:text-base shrink-0
                  ${index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    index === 1 ? "bg-gray-400/20 text-gray-300" :
                    index === 2 ? "bg-amber-600/20 text-amber-500" :
                    "bg-zinc-800/60 text-zinc-500"}
                `}>
                  {member.rank}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">
                    {member.username}
                    {member.isMe && <span className="ml-2 text-[10px] sm:text-xs text-emerald-400">(You)</span>}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm sm:text-base tabular-nums">${member.total_value.toLocaleString()}</p>
                  <p className={`text-xs sm:text-sm tabular-nums ${member.total_return_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {member.total_return_percent >= 0 ? "+" : ""}
                    {member.total_return_percent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
