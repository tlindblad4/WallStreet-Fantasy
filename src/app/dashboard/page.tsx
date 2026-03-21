import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, Users, TrendingUp, Plus, TrendingUpIcon, Search, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DeleteLeagueButton from "@/components/DeleteLeagueButton";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import AchievementsPanel from "@/components/AchievementsPanel";
import MarketOverview from "@/components/MarketOverview";
import { GlassCard, GradientText, PremiumStatCard } from "@/components/ui/PremiumCards";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { PremiumLeagueCard } from "@/components/PremiumLeagueCard";
import EmptyLeaguesState from "@/components/EmptyLeaguesState";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  // Get memberships with league info
  const { data: memberships } = await supabase
    .from("league_members")
    .select(`
      id,
      cash_balance,
      total_value,
      total_return_percent,
      current_rank,
      league:leagues(id, name, status, season_start_date, season_end_date, commissioner_id, starting_balance)
    `)
    .eq("user_id", session.user.id)
    .eq("status", "active");

  const leagues = memberships || [];
  
  // Fix: league comes back as an array from Supabase relation
  const normalizedLeagues = leagues.map(l => ({
    ...l,
    league: Array.isArray(l.league) ? l.league[0] : l.league
  }));

  // Fetch holdings for each league to calculate actual portfolio values
  const leaguesWithCalculatedValues = await Promise.all(
    normalizedLeagues.map(async (membership) => {
      const { data: holdings } = await supabase
        .from("portfolio_holdings")
        .select("current_value")
        .eq("league_member_id", membership.id);

      const holdingsValue = (holdings || []).reduce((sum, h) => sum + (h.current_value || 0), 0);
      const cashBalance = membership.cash_balance || 0;
      const calculatedTotalValue = cashBalance + holdingsValue;
      const startingBalance = membership.league?.starting_balance || 100000;
      const calculatedReturn = calculatedTotalValue - startingBalance;
      const calculatedReturnPercent = startingBalance > 0 ? (calculatedReturn / startingBalance) * 100 : 0;

      return {
        ...membership,
        calculatedTotalValue,
        calculatedReturn,
        calculatedReturnPercent,
        holdingsValue,
      };
    })
  );

  // Calculate totals across all leagues
  const totalPortfolioValue = leaguesWithCalculatedValues.reduce((sum, l) => sum + l.calculatedTotalValue, 0);
  const avgReturn = leaguesWithCalculatedValues.length > 0
    ? leaguesWithCalculatedValues.reduce((sum, l) => sum + l.calculatedReturnPercent, 0) / leaguesWithCalculatedValues.length
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900/60 border-b border-zinc-800/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">WallStreet Fantasy</span>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <span className="text-zinc-400 text-sm">{session.user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FadeIn>
          <h1 className="text-4xl font-bold mb-2">
            <GradientText>Dashboard</GradientText>
          </h1>
          <p className="text-zinc-400 mb-8">Track your portfolios and market performance</p>
        </FadeIn>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StaggerItem>
            <PremiumStatCard
              label="Active Leagues"
              value={leaguesWithCalculatedValues.length.toString()}
              icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            />
          </StaggerItem>
          <StaggerItem>
            <PremiumStatCard
              label="Total Portfolio Value"
              value={`$${totalPortfolioValue.toLocaleString()}`}
              change={avgReturn >= 0 ? `+${avgReturn.toFixed(1)}%` : `${avgReturn.toFixed(1)}%`}
              changeType={avgReturn >= 0 ? "positive" : "negative"}
              icon={<Wallet className="w-6 h-6 text-emerald-400" />}
            />
          </StaggerItem>
          <StaggerItem>
            <PremiumStatCard
              label="Best Performer"
              value={leaguesWithCalculatedValues.length > 0 
                ? leaguesWithCalculatedValues.reduce((best, l) => 
                    l.calculatedReturnPercent > best.calculatedReturnPercent ? l : best
                  ).league?.name?.substring(0, 15) + "..." || "-"
                : "-"}
              change={leaguesWithCalculatedValues.length > 0
                ? `+${leaguesWithCalculatedValues.reduce((best, l) => 
                    l.calculatedReturnPercent > best.calculatedReturnPercent ? l : best
                  ).calculatedReturnPercent.toFixed(1)}%`
                : undefined}
              changeType="positive"
              icon={<ArrowUpRight className="w-6 h-6 text-emerald-400" />}
            />
          </StaggerItem>
        </StaggerContainer>



        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Link href="/leagues/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create League
            </Button>
          </Link>
          <Link href="/leagues/join">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Join League
            </Button>
          </Link>
        </div>

        {/* Market Overview */}
        <div className="mb-8">
          <MarketOverview />
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <AchievementsPanel />
        </div>

        {/* Leagues */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Leagues</h2>
          {leaguesWithCalculatedValues.length === 0 ? (
            <EmptyLeaguesState />
          ) : (
            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaguesWithCalculatedValues.map((membership) => (
                <StaggerItem key={membership.id}>
                  <PremiumLeagueCard 
                    membership={membership} 
                    currentUserId={session.user.id} 
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function LeagueCard({ membership, currentUserId }: { membership: any; currentUserId: string }) {
  const league = membership.league;
  const isCommissioner = league.commissioner_id === currentUserId;
  
  return (
    <div className="relative">
      <Link href={`/leagues/${league.id}`}>
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{league.name}</h3>
              <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                league.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                league.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-zinc-700 text-zinc-400'
              }`}>
                {league.status}
              </span>
            </div>
            {membership.current_rank && (
              <div className="text-right">
                <span className="text-2xl font-bold text-yellow-400">#{membership.current_rank}</span>
                <p className="text-xs text-zinc-400">rank</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-zinc-400 text-sm">Portfolio Value</p>
              <p className="text-lg font-semibold">${membership.calculatedTotalValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Cash</p>
              <p className="text-lg font-semibold text-emerald-400">${membership.cash_balance?.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-zinc-400 text-sm">Return</p>
            <p className={`text-lg font-semibold ${
              membership.calculatedReturnPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {membership.calculatedReturnPercent >= 0 ? '+' : ''}{membership.calculatedReturnPercent.toFixed(2)}%
            </p>
          </div>
        </div>
      </Link>
      
      {/* Delete button — only visible to commissioner */}
      {isCommissioner && (
        <div className="absolute top-3 right-3">
          <DeleteLeagueButton leagueId={league.id} />
        </div>
      )}
    </div>
  );
}
