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

  const { data: member } = await supabase
    .from("league_members")
    .select("*")
    .eq("league_id", leagueId)
    .eq("user_id", session.user.id)
    .single();

  const { data: holdings } = await supabase
    .from("portfolio_holdings")
    .select("*")
    .eq("league_member_id", member?.id);

  const { data: invite } = await supabase
    .from("league_invites")
    .select("invite_code")
    .eq("league_id", leagueId)
    .single();

  const isCommissioner = league.commissioner_id === session.user.id;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm">
              {"<-"} Back
            </Link>
            <h1 className="text-base sm:text-xl font-bold truncate max-w-[200px] sm:max-w-none">{league.name}</h1>
            <div className="w-10 sm:w-16">
              {isCommissioner && <DeleteLeagueButton leagueId={leagueId} />}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-6">
        {member && (
          <PortfolioRefresh leagueMemberId={member.id} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-zinc-500 mb-1">Portfolio Value</p>
            <p className="text-lg sm:text-xl font-bold">${member?.total_value?.toLocaleString() || "0"}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-zinc-500 mb-1">Cash</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">${member?.cash_balance?.toLocaleString() || "0"}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-zinc-500 mb-1">Return</p>
            <p className={`text-lg sm:text-xl font-bold ${member?.total_return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {member?.total_return_percent >= 0 ? '+' : ''}{member?.total_return_percent?.toFixed(1) || "0"}%
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs text-zinc-500 mb-1">Rank</p>
            <p className="text-lg sm:text-xl font-bold text-amber-400">#{member?.current_rank || "-"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6 sm:mb-8">
          <Link href={`/leagues/${leagueId}/trade`} className="flex-1">
            <Button className="w-full h-11 sm:h-12">
              Trade Stocks
            </Button>
          </Link>
          <Link href={`/leagues/${leagueId}/leaderboard`} className="flex-1">
            <Button variant="outline" className="w-full h-11 sm:h-12">
              Leaderboard
            </Button>
          </Link>
        </div>

        {/* Portfolio Chart */}
        <div className="mb-6 sm:mb-8">
          <PortfolioChart
            metrics={{
              totalValue: member?.total_value || 100000,
              cashBalance: member?.cash_balance || 100000,
              totalReturn: member?.total_return || 0,
              totalReturnPercent: member?.total_return_percent || 0,
              dayChange: 0,
              dayChangePercent: 0,
              bestPerformer: holdings && holdings.length > 0
                ? holdings.reduce((best: any, h: any) =>
                    (h.unrealized_gain_loss_percent || 0) > (best?.return || 0)
                      ? { symbol: h.symbol, return: h.unrealized_gain_loss_percent || 0 }
                      : best,
                    null
                  )
                : null,
              worstPerformer: holdings && holdings.length > 0
                ? holdings.reduce((worst: any, h: any) =>
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
        <div className="mb-6 sm:mb-8">
          <HoldingsList holdings={holdings || []} />
        </div>

        {/* Invite Friends Section */}
        {invite && (
          <div className="mb-6 sm:mb-8">
            <InviteShare
              inviteCode={invite.invite_code}
              leagueName={league.name}
            />
          </div>
        )}

        {/* League Info */}
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">League Settings</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs sm:text-sm">Starting Balance</p>
              <p className="font-semibold text-sm sm:text-base">${league.starting_balance?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs sm:text-sm">Season Length</p>
              <p className="font-semibold text-sm sm:text-base">{league.season_length_days} days</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs sm:text-sm">Max Players</p>
              <p className="font-semibold text-sm sm:text-base">{league.max_players}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs sm:text-sm">Status</p>
              <p className="font-semibold text-sm sm:text-base capitalize">{league.status}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
