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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    // Create league
    const { data: league, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        name,
        description,
        commissioner_id: user.id,
        starting_balance: startingBalance,
        season_length_days: seasonLength,
        max_players: maxPlayers,
        status: "draft",
      })
      .select()
      .single();

    if (leagueError) {
      setError(leagueError.message);
      setLoading(false);
      return;
    }

    // Add commissioner as first member
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

    // Generate invite code
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
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New League</h1>

        {inviteCode ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">League Created!</h2>
            <p className="text-slate-400 mb-6">
              Share this invite code with friends to join your league:
            </p>
            <div className="bg-slate-800 rounded-lg px-6 py-4 mb-6">
              <code className="text-3xl font-mono font-bold">{inviteCode}</code>
            </div>
            <Link href="/dashboard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="My Fantasy League"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="A friendly competition among friends..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Starting Balance
                  </label>
                  <select
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value={50000}>$50,000</option>
                    <option value={100000}>$100,000</option>
                    <option value={250000}>$250,000</option>
                    <option value={1000000}>$1,000,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Season Length (days)
                  </label>
                  <select
                    value={seasonLength}
                    onChange={(e) => setSeasonLength(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                    <option value={180}>180 days</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Players
                  </label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create League"}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
