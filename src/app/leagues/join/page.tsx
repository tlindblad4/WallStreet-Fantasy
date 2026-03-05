"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Users, TicketCheck, Loader2 } from "lucide-react";

export default function JoinLeaguePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      const supabase = createClient();

      // Check user auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("You must be logged in");
        setLoading(false);
        return;
      }

      const trimmedCode = inviteCode.trim().toUpperCase();
      setDebugInfo(`Looking up code: "${trimmedCode}"`);

      // Find invite - use exact match (case insensitive via ilike)
      const { data: invite, error: inviteError } = await supabase
        .from("league_invites")
        .select("league_id, uses_count, max_uses, invite_code")
        .eq("invite_code", trimmedCode)
        .maybeSingle();

      if (inviteError) {
        console.error("Invite lookup error:", inviteError);
        setError(`Error looking up invite code: ${inviteError.message}`);
        setLoading(false);
        return;
      }

      if (!invite) {
        // Try to find any invites for debugging
        const { data: allInvites } = await supabase
          .from("league_invites")
          .select("invite_code")
          .limit(5);
        
        console.log("Available invite codes:", allInvites?.map(i => i.invite_code));
        setError(`Invalid invite code: "${trimmedCode}". Code not found in database.`);
        setLoading(false);
        return;
      }

      setDebugInfo(`Found invite: ${invite.invite_code} (uses: ${invite.uses_count}/${invite.max_uses})`);

      if (invite.uses_count >= invite.max_uses) {
        setError("This invite code has reached its maximum uses");
        setLoading(false);
        return;
      }

      // Check if already a member - use maybeSingle
      const { data: existingMember } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", invite.league_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        setError("You're already a member of this league");
        setLoading(false);
        return;
      }

      // Get league info
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .select("starting_balance, name")
        .eq("id", invite.league_id)
        .single();

      if (leagueError || !league) {
        console.error("League lookup error:", leagueError);
        setError("Error finding league");
        setLoading(false);
        return;
      }

      setDebugInfo(`Joining league: ${league.name}`);

      // Join league
      const { error: joinError } = await supabase
        .from("league_members")
        .insert({
          league_id: invite.league_id,
          user_id: user.id,
          status: "active",
          cash_balance: league.starting_balance || 100000,
          total_value: league.starting_balance || 100000,
        });

      if (joinError) {
        console.error("Join error:", joinError);
        setError(joinError.message);
        setLoading(false);
        return;
      }

      // Update invite count
      const { error: updateError } = await supabase
        .from("league_invites")
        .update({ uses_count: invite.uses_count + 1 })
        .eq("invite_code", invite.invite_code);

      if (updateError) {
        console.error("Update invite error:", updateError);
        // Don't fail if update fails, user already joined
      }

      setSuccess(true);
      
      // Redirect to league after 2 seconds
      setTimeout(() => {
        router.push(`/leagues/${invite.league_id}`);
      }, 2000);
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(`An unexpected error occurred: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/6 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-teal-500/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TicketCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Join a League</h1>
          <p className="text-zinc-500 text-sm mt-2">Enter your invite code to join</p>
        </div>

        {/* Card */}
        {success ? (
          <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Welcome!</h2>
            <p className="text-zinc-400 text-sm">
              You&apos;ve successfully joined the league. Redirecting...
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-sm">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                {error}
              </div>
            )}

            {debugInfo && (
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl mb-4 text-xs">
                {debugInfo}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Invite Code
                </label>
                <div className="relative">
                  <TicketCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg uppercase tracking-wider placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                    placeholder="ABC12345"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-zinc-500 text-sm mt-2">
                  Ask your friend for their invite code
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !inviteCode.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join League"
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
