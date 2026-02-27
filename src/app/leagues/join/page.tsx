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

    // Find invite
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

    // Check if already a member
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

    // Get league starting balance
    const { data: league } = await supabase
      .from("leagues")
      .select("starting_balance")
      .eq("id", invite.league_id)
      .single();

    // Join league
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

    // Update invite uses
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">Join League</h1>
          <p className="text-gray-400 mt-2">Enter an invite code to join a league</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl font-bold tracking-wider uppercase focus:outline-none focus:border-green-500"
                maxLength={10}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold h-12 rounded-xl"
              disabled={loading}
            >
              {loading ? "Joining..." : "Join League"}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don&apos;t have a code?{" "}
            <Link href="/leagues/create" className="text-green-400 hover:text-green-300">
              Create your own league
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
