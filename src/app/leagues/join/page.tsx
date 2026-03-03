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
  const [success, setSuccess] = useState(false);
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

    // Find invite
    const { data: invite, error: inviteError } = await supabase
      .from("league_invites")
      .select("league_id, uses_count, max_uses")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (inviteError || !invite) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    if (invite.uses_count >= invite.max_uses) {
      setError("This invite code has reached its maximum uses");
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
      setError("You're already a member of this league");
      setLoading(false);
      return;
    }

    // Get league info for starting balance
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

    // Update invite count
    await supabase
      .from("league_invites")
      .update({ uses_count: invite.uses_count + 1 })
      .eq("invite_code", inviteCode.toUpperCase());

    setSuccess(true);
    setLoading(false);

    // Redirect to league after 2 seconds
    setTimeout(() => {
      router.push(`/leagues/${invite.league_id}`);
    }, 2000);
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
        <h1 className="text-3xl font-bold mb-8">Join a League</h1>

        {success ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-4">Welcome to the League!</h2>
            <p className="text-slate-400">
              You've successfully joined. Redirecting you now...
            </p>
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
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-lg uppercase tracking-wider focus:outline-none focus:border-blue-500"
                  placeholder="ABC123"
                  maxLength={8}
                  required
                />
                <p className="text-slate-500 text-sm mt-2">
                  Enter the invite code from your friend
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join League"}
              </Button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
