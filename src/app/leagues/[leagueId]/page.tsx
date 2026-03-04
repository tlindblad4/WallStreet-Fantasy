import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, ArrowRight, TrendingDown } from "lucide-react";
import InviteShare from "@/components/InviteShare";
import DeleteLeagueButton from "@/components/DeleteLeagueButton";
import PortfolioChart from "@/components/PortfolioChart";
import HoldingsList from "@/components/HoldingsList";
import PortfolioRefresh from "@/components/PortfolioRefresh";

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

  // Get portfolio holdings
  const { data: holdings } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("league_member_id", member?.id);

  // Calculate actual total value (cash + holdings)
  const holdingsValue = (holdings || []).reduce((sum, h) => sum + (h.current_value || 0), 0);
  const cashBalance = member?.cash_balance || 0;
  const calculatedTotalValue = cashBalance + holdingsValue;
  const startingBalance = league?.starting_balance || 100000;
  const calculatedReturn = calculatedTotalValue - startingBalance;
  const calculatedReturnPercent = startingBalance > 0 ? (calculatedReturn / startingBalance) * 100 : 0;

  const isCommissioner = league.commissioner_id === session.user.id;

  // Get or create invite code
  let invite = null;
  try {
    const { data: existingInvite } = await supabase
      .from("league_invites")
      .select("invite_code")
      .eq("league_id", leagueId)
      .single();
    invite = existingInvite;
  } catch {
    // No invite found, will create below
  }

  // If no invite exists, create one
  if (!invite && isCommissioner) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      const { data: newInvite } = await supabase
        .from("league_invites")
        .insert({
          league_id: leagueId,
          invited_by: session.user.id,
          invite_code: newCode,
          max_uses: 100,
        })
        .select()
        .single();
      invite = newInvite;
    } catch (err) {
      console.error("Failed to create invite:", err);
    }
  }

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
        {/* Auto-refresh prices */}
        {member && (
          <PortfolioRefresh leagueMemberId={member.id} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Portfolio Value</p>
            <p className="text-xl font-bold">${calculatedTotalValue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Cash + Holdings</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Cash</p>
            <p className="text-xl font-bold text-green-400">${cashBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Available to trade</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Return</p>
            <p className={`text-xl font-bold ${calculatedReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {calculatedReturnPercent >= 0 ? '+' : ''}{calculatedReturnPercent.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">${calculatedReturn >= 0 ? '+' : ''}{calculatedReturn.toLocaleString()}</p>
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

        {/* Portfolio Chart */}
        <div className="mb-8">
          <PortfolioChart
            metrics={{
              totalValue: calculatedTotalValue,
              cashBalance: cashBalance,
              totalReturn: calculatedReturn,
              totalReturnPercent: calculatedReturnPercent,
              dayChange: 0,
              dayChangePercent: 0,
              bestPerformer: holdings && holdings.length > 0
                ? holdings.reduce((best, h) =>
                    (h.unrealized_gain_loss_percent || 0) > (best?.return || 0)
                      ? { symbol: h.symbol, return: h.unrealized_gain_loss_percent || 0 }
                      : best,
                    null
                  )
                : null,
              worstPerformer: holdings && holdings.length > 0
                ? holdings.reduce((worst, h) =>
                    (h.unrealized_gain_loss_percent || 0) < (worst?.return || 0)
                      ? { symbol: h.symbol, return: h.unrealized_gain_loss_percent || 0 }
                      : worst,
                    null
                  )
                : null,
            }}
          />
        </div>

        {/* Holdings List */}
        <div className="mb-8">
          <HoldingsList holdings={holdings || []} />
        </div>

        {/* Invite Friends Section - Always show for commissioners */}
        {isCommissioner && invite && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span className="text-emerald-400">👥</span> Invite Friends
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                Share this code with friends to invite them to your league
              </p>
              
              {/* Big Invite Code Display */}
              <div className="bg-zinc-950 rounded-xl p-6 mb-4 text-center border border-emerald-500/20">
                <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Your Invite Code</p>
                <code className="text-4xl font-mono font-bold text-emerald-400 tracking-[0.2em]">
                  {invite.invite_code}
                </code>
              </div>
            </div>
            
            <InviteShare
              inviteCode={invite.invite_code}
              leagueName={league.name}
              leagueId={leagueId}
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
            {isCommissioner && invite && (
              <>
                <div className="col-span-2 mt-2 pt-4 border-t border-white/10">
                  <p className="text-gray-400">Invite Code</p>
                  <p className="font-mono font-bold text-emerald-400 text-lg tracking-wider">
                    {invite.invite_code}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
