"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown } from "lucide-react";
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
  const leagueId = params.leagueId;

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get league name
    const { data: league } = await supabase
      .from("leagues")
      .select("name")
      .eq("id", leagueId)
      .single();
    
    if (league) setLeagueName(league.name);

    // Get members with rankings
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/leagues/${leagueId}`} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Leaderboard</h1>
              <p className="text-sm text-gray-400">{leagueName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={member.user_id}
                className={`rounded-2xl p-4 flex items-center gap-4 ${
                  member.isMe
                    ? "bg-green-500/20 border border-green-500/50"
                    : "bg-white/5"
                }`}
              >
                {/* Rank */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center font-bold
                  ${index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                    index === 1 ? "bg-gray-400/20 text-gray-300" :
                    index === 2 ? "bg-amber-600/20 text-amber-500" :
                    "bg-white/10 text-gray-400"}
                `}>
                  {member.rank}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-semibold">
                    {member.username}
                    {member.isMe && <span className="ml-2 text-xs text-green-400">(You)</span>}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className="font-bold">${member.total_value.toLocaleString()}</p>
                  <p className={`text-sm ${member.total_return_percent >= 0 ? "text-green-400" : "text-red-400"}`}>
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
