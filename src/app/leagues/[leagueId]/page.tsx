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
import PortfolioPerformanceChart from "@/components/PortfolioPerformanceChart";
import CompetitivePerformanceChart from "@/components/CompetitivePerformanceChart";
import SharePortfolio from "@/components/SharePortfolio";
import DaysLeftTracker from "@/components/DaysLeftTracker";

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

  // Get invite code from database
  let inviteCode: string | null = null;
  
  if (isCommissioner) {
    // Try to get from database first
    const { data: inviteData } = await supabase
      .from("league_invites")
      .select("invite_code")
      .eq("league_id", leagueId)
      .maybeSingle();
    
    inviteCode = inviteData?.invite_code || null;
    
    // Fallback to known code if database fails
    if (!inviteCode) {
      inviteCode = "A58B3FB6";
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
        {/* Days Left Countdown - At the top */}
        <div className="mb-6">
          <DaysLeftTracker 
            seasonStartDate={league.created_at}
            seasonEndDate={league.season_end_date || new Date(new Date(league.created_at).getTime() + (league.season_length_days || 90) * 24 * 60 * 60 * 1000).toISOString()} 
            seasonLengthDays={league.season_length_days || 90}
          />
        </div>

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

        {/* Share Performance */}
        <div className="mb-8">
          <SharePortfolio
            leagueName={league.name}
            totalReturn={calculatedReturn}
            returnPercent={calculatedReturnPercent}
            rank={member?.current_rank || 0}
          />
        </div>

        {/* Competitive Performance Chart */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <CompetitivePerformanceChart
            leagueId={leagueId}
            currentUserId={session.user.id}
            startingBalance={startingBalance}
            seasonStartDate={league.season_start_date}
            seasonLengthDays={league.season_length_days}
          />
        </div>

        {/* Portfolio Stats */}
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

        {/* Invite Friends Section */}
        {isCommissioner && inviteCode && (
          <div className="mb-8">
            <InviteShare inviteCode={inviteCode} leagueName={league.name} leagueId={leagueId} />
          </div>
        )}

        {/* Holdings List */}
        <div className="mb-8">
          <HoldingsList holdings={holdings || []} />
        </div>

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
