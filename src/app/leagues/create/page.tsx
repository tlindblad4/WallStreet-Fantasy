"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function CreateLeaguePage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startingBalance, setStartingBalance] = useState(100000);
  const [seasonLength, setSeasonLength] = useState(90);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [allowOptions, setAllowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        name,
        description,
        commissioner_id: user.id,
        starting_balance: startingBalance,
        season_length_days: seasonLength,
        max_players: maxPlayers,
        allow_options_trading: allowOptions,
        status: "draft",
      })
      .select()
      .single();

    if (leagueError) {
      setError(leagueError.message);
      setLoading(false);
      return;
    }

    const { error: memberError } = await supabase
      .from("league_members")
      .insert({
        league_id: league.id,
        user_id: user.id,
        status: "active",
        cash_balance: startingBalance,
      });

    if (memberError) {
      setError(memberError.message);
      setLoading(false);
      return;
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data: invite } = await supabase
      .from("league_invites")
      .insert({
        league_id: league.id,
        invited_by: user.id,
        invite_code: code,
        max_uses: 100,
      })
      .select()
      .single();

    if (invite) {
      setInviteCode(code);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 sm:py-4">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-6 sm:mb-8">Create New League</h1>

        {inviteCode ? (
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 mb-4">League Created!</h2>
            <p className="text-zinc-400 text-sm sm:text-base mb-6">
              Share this invite code with friends to join your league:
            </p>
            <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-6 py-4 mb-6">
              <code className="text-2xl sm:text-3xl font-mono font-bold text-white">{inviteCode}</code>
            </div>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 sm:p-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="My Fantasy League"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="A friendly competition among friends..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Starting Balance
                  </label>
                  <select
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value={50000}>$50,000</option>
                    <option value={100000}>$100,000</option>
                    <option value={250000}>$250,000</option>
                    <option value={1000000}>$1,000,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Season Length
                  </label>
                  <select
                    value={seasonLength}
                    onChange={(e) => setSeasonLength(Number(e.target.value))}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Max Players
                  </label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-4">
                <label className="flex items-start sm:items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowOptions}
                    onChange={(e) => setAllowOptions(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500 mt-0.5 sm:mt-0"
                  />
                  <div>
                    <p className="font-medium text-zinc-200 text-sm sm:text-base">Enable Options Trading</p>
                    <p className="text-xs sm:text-sm text-zinc-500">
                      Allow members to trade call and put options for advanced strategies
                    </p>
                  </div>
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create League"
                )}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
