"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Users } from "lucide-react";

export default function JoinLeaguePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data: invite } = await supabase
      .from("league_invites")
      .select("league_id, uses_count, max_uses")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (!invite) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    if (invite.uses_count >= invite.max_uses) {
      setError("Invite code has been used up");
      setLoading(false);
      return;
    }

    const { data: existingMember } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", invite.league_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      setError("You're already in this league");
      setLoading(false);
      return;
    }

    const { data: league } = await supabase
      .from("leagues")
      .select("starting_balance")
      .eq("id", invite.league_id)
      .single();

    const { error: joinError } = await supabase
      .from("league_members")
      .insert({
        league_id: invite.league_id,
        user_id: user.id,
        status: "active",
        cash_balance: league?.starting_balance || 100000,
      });

    if (joinError) {
      setError(joinError.message);
      setLoading(false);
      return;
    }

    await supabase
      .from("league_invites")
      .update({ uses_count: invite.uses_count + 1 })
      .eq("invite_code", inviteCode.toUpperCase());

    setSuccess("Successfully joined league!");
    setTimeout(() => {
      router.push(`/leagues/${invite.league_id}`);
    }, 1500);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3 sm:py-4">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Join League</h1>
          <p className="text-zinc-500 text-sm mt-2">Enter an invite code to join a league</p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-5 sm:p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white text-center text-xl sm:text-2xl font-bold tracking-wider uppercase placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                maxLength={10}
                required
              />
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
                  Joining...
                </span>
              ) : (
                "Join League"
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            {"Don't have a code? "}
            <Link href="/leagues/create" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
              Create your own league
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
