import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, Users, TrendingUp, Plus, ArrowLeft, TrendingUpIcon } from "lucide-react";
import DeleteLeagueButton from "@/components/DeleteLeagueButton";
import PortfolioRefresh from "@/components/PortfolioRefresh";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select(`
      id,
      cash_balance,
      total_value,
      total_return_percent,
      current_rank,
      league:leagues(id, name, status, season_start_date, season_end_date, commissioner_id)
    `)
    .eq("user_id", session.user.id)
    .eq("status", "active");

  const leagues = memberships || [];
  // Fix: league comes back as an array from Supabase relation
  const normalizedLeagues = leagues.map(l => ({
    ...l,
    league: Array.isArray(l.league) ? l.league[0] : l.league
  }));
  const leagueMembersForRefresh = normalizedLeagues.map(l => ({ id: l.id, league_id: l.league?.id }));

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
              <span className="text-zinc-400 text-sm">{session.user.email}</span>
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Refresh - Updates values from market */}
        {leagues.length > 0 && (
          <div className="mb-8">
            {leagues.map((membership) => (
              <PortfolioRefresh key={membership.id} leagueMemberId={membership.id} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Leagues"
            value={normalizedLeagues.length.toString()}
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
          />
          <StatCard
            title="Total Portfolio Value"
            value={`$${normalizedLeagues.reduce((sum, l) => sum + (l.total_value || 0), 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
          />
          <StatCard
            title="Avg. Return"
            value={`${(normalizedLeagues.reduce((sum, l) => sum + (l.total_return_percent || 0), 0) / (normalizedLeagues.length || 1)).toFixed(1)}%`}
            icon={<Users className="w-6 h-6 text-blue-400" />}
          />
        </div>

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

        {/* Leagues */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Leagues</h2>
          {normalizedLeagues.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-12 text-center">
              <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No leagues yet</h3>
              <p className="text-zinc-400 mb-6">
                Create your first league or join one to start competing!
              </p>
              <Link href="/leagues/create">
                <Button>
                  Create Your First League
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {normalizedLeagues.map((membership) => (
                <LeagueCard 
                  key={membership.id} 
                  membership={membership} 
                  currentUserId={session.user.id} 
                />
              ))}
            </div>
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
              <p className="text-lg font-semibold">${membership.total_value?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-400 text-sm">Cash</p>
              <p className="text-lg font-semibold text-emerald-400">${membership.cash_balance?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-zinc-400 text-sm">Return</p>
            <p className={`text-lg font-semibold ${
              membership.total_return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {membership.total_return_percent >= 0 ? '+' : ''}
              {membership.total_return_percent?.toFixed(2)}%
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
