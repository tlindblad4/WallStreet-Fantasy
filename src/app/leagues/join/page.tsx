"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Users, TicketCheck, Loader2, RefreshCw } from "lucide-react";

export default function JoinLeaguePage() {
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const router = useRouter();

  // Load available invite codes on mount
  useEffect(() => {
    const loadCodes = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("league_invites")
        .select("invite_code")
        .order("created_at", { ascending: false })
        .limit(10);
      
      console.log("Loaded invite codes:", data, "Error:", error);
      
      if (data) {
        setAvailableCodes(data.map(i => i.invite_code));
      } else if (error) {
        console.error("Error loading invite codes:", error);
      }
    };
    loadCodes();
  }, []);

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

      // Find invite - try exact match first
      console.log("Looking up invite code:", trimmedCode);
      
      let { data: invite, error: inviteError } = await supabase
        .from("league_invites")
        .select("league_id, uses_count, max_uses, invite_code")
        .eq("invite_code", trimmedCode)
        .maybeSingle();

      // If not found, try case-insensitive match
      if (!invite && !inviteError) {
        console.log("Exact match not found, trying case-insensitive...");
        const { data: allInvites } = await supabase
          .from("league_invites")
          .select("league_id, uses_count, max_uses, invite_code");
        
        console.log("All invites in DB:", allInvites);
        
        // Manual case-insensitive match
        invite = allInvites?.find(i => 
          i.invite_code.toUpperCase() === trimmedCode
        ) || null;
      }

      if (inviteError) {
        console.error("Invite lookup error:", inviteError);
        setError(`Error: ${inviteError.message}`);
        setLoading(false);
        return;
      }

      if (!invite) {
        setError(`Invalid invite code: "${trimmedCode}". Available codes: ${availableCodes.join(", ") || "None found"}`);
        setLoading(false);
        return;
      }

      setDebugInfo(`Found: ${invite.invite_code} (uses: ${invite.uses_count}/${invite.max_uses})`);

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
        setError("Error finding league");
        setLoading(false);
        return;
      }

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
        setError(joinError.message);
        setLoading(false);
        return;
      }

      // Update invite count
      await supabase
        .from("league_invites")
        .update({ uses_count: invite.uses_count + 1 })
        .eq("invite_code", invite.invite_code);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/leagues/${invite.league_id}`);
      }, 2000);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <TicketCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Join a League</h1>
          <p className="text-zinc-500 text-sm mt-2">Enter your invite code to join</p>
        </div>

        {success ? (
          <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Welcome!</h2>
            <p className="text-zinc-400 text-sm">You've joined the league. Redirecting...</p>
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8">
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

            {/* Show available codes for debugging */}
            {availableCodes.length > 0 && (
              <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-zinc-500 uppercase">Available Invite Codes:</p>
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {showDebug ? "Hide" : "Show"}
                  </button>
                </div>
                {showDebug && (
                  <div className="flex flex-wrap gap-2">
                    {availableCodes.map(code => (
                      <button
                        key={code}
                        onClick={() => setInviteCode(code)}
                        className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-mono text-emerald-400 transition-colors"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Invite Code</label>
                <div className="relative">
                  <TicketCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-lg uppercase tracking-wider placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                    placeholder="ABC12345"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !inviteCode.trim()}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Joining...</> : "Join League"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
