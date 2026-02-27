import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, ArrowRight } from "lucide-react";
import InviteShare from "@/components/InviteShare";
import DeleteLeagueButton from "@/components/DeleteLeagueButton";

export default async function LeaguePage({ 
  params 
}: { 
  params: Promise<{ leagueId: string }> 
}) {
  const { leagueId } = await params;
  const supabase = await createServerSupabaseClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Get league details
  const { data: league } = await supabase
    .from("leagues")
    .select(`
      *,
      commissioner:profiles(id, username)
    `)
    .eq("id", leagueId)
    .single();

  if (!league) {
    redirect("/dashboard");
  }

  // Get member info
  const { data: member } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", leagueId)
    .eq("user_id", session.user.id)
    .single();

  // Get invite code
  const { data: invite } = await supabase
    .from("league_invites")
    .select("invite_code")
    .eq("league_id", leagueId)
    .single();

  const isCommissioner = league.commissioner_id === session.user.id;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-gray-400 hover:text-white">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">{league.name}</h1>
            <div className="w-16">
              {isCommissioner && <DeleteLeagueButton leagueId={leagueId} />}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Portfolio Value</p>
            <p className="text-xl font-bold">${member?.total_value?.toLocaleString() || "0"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Cash</p>
            <p className="text-xl font-bold text-green-400">${member?.cash_balance?.toLocaleString() || "0"}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Return</p>
            <p className={`text-xl font-bold ${member?.total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {member?.total_return_percent >= 0 ? '+' : ''}{member?.total_return_percent?.toFixed(1) || "0"}%
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Rank</p>
            <p className="text-xl font-bold text-yellow-400">#{member?.current_rank || "-"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Link href={`/leagues/${leagueId}/trade`} className="flex-1">
            <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-semibold h-12">
              Trade Stocks
            </Button>
          </Link>
          <Link href={`/leagues/${leagueId}/leaderboard`} className="flex-1">
            <Button variant="outline" className="w-full border-white/20 h-12">
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Invite Friends Section */}
        {invite && (
          <div className="mb-8">
            <InviteShare 
              inviteCode={invite.invite_code} 
              leagueName={league.name}
            />
          </div>
        )}

        {/* League Info */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">League Settings</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Starting Balance</p>
              <p className="font-semibold">${league.starting_balance?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">Season Length</p>
              <p className="font-semibold">{league.season_length_days} days</p>
            </div>
            <div>
              <p className="text-gray-400">Max Players</p>
              <p className="font-semibold">{league.max_players}</p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-semibold capitalize">{league.status}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
