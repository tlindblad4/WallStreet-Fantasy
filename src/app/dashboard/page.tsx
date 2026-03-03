import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, Users, TrendingUp, Plus, ChevronRight } from "lucide-react";
import DeleteLeagueButton from "@/components/DeleteLeagueButton";

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-800/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-shadow duration-300">
                <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline text-lg font-bold tracking-tight">WallStreet Fantasy</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-zinc-500 truncate max-w-[120px] sm:max-w-none">{session.user.email}</span>
              <form action="/api/auth/logout" method="post">
                <Button type="submit" variant="outline" size="sm" className="text-xs sm:text-sm">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Page title */}
        <div className="mb-6 sm:mb-10">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-2 block">Overview</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <StatCard
            title="Active Leagues"
            value={leagues.length.toString()}
            icon={<Trophy className="w-5 h-5 text-amber-400" />}
            accentColor="amber"
          />
          <StatCard
            title="Total Portfolio Value"
            value={`$${leagues.reduce((sum, l) => sum + (l.total_value || 0), 0).toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            accentColor="emerald"
          />
          <StatCard
            title="Avg. Return"
            value={`${(leagues.reduce((sum, l) => sum + (l.total_return_percent || 0), 0) / (leagues.length || 1)).toFixed(1)}%`}
            icon={<Users className="w-5 h-5 text-sky-400" />}
            accentColor="sky"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-10">
          <Link href="/leagues/create">
            <Button>
              <Plus className="w-4 h-4" />
              Create League
            </Button>
          </Link>
          <Link href="/leagues/join">
            <Button variant="outline">
              <Users className="w-4 h-4" />
              Join League
            </Button>
          </Link>
        </div>

        {/* Leagues */}
        <div>
          <h2 className="text-xl font-bold mb-6">Your Leagues</h2>
          {leagues.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-5">
                <Trophy className="w-7 h-7 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No leagues yet</h3>
              <p className="text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Create your first league or join one to start competing!
              </p>
              <Link href="/leagues/create">
                <Button className="group">
                  Create Your First League
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagues.map((membership) => (
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

function StatCard({ title, value, icon, accentColor }: { title: string; value: string; icon: React.ReactNode; accentColor: string }) {
  const hoverBorderColors: Record<string, string> = {
    amber: "hover:border-amber-500/30",
    emerald: "hover:border-emerald-500/30",
    sky: "hover:border-sky-500/30",
  };

  return (
    <div className={`bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 transition-all duration-300 ${hoverBorderColors[accentColor] || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-black mt-1 tabular-nums">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function LeagueCard({ membership, currentUserId }: { membership: any; currentUserId: string }) {
  const league = membership.league;
  const isCommissioner = league.commissioner_id === currentUserId;
  
  return (
    <div className="relative group">
      <Link href={`/leagues/${league.id}`}>
        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 hover:bg-zinc-800/40 hover:border-zinc-700/60 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">{league.name}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold mt-2 ${
                league.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                league.status === 'draft' ? 'bg-amber-500/10 text-amber-400' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {league.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                {league.status}
              </span>
            </div>
            {membership.current_rank && (
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400 tabular-nums">#{membership.current_rank}</span>
                <p className="text-xs text-zinc-500 font-medium">rank</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800/40">
            <div>
              <p className="text-zinc-500 text-xs font-medium mb-1">Portfolio Value</p>
              <p className="text-base font-bold tabular-nums">${membership.total_value?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-medium mb-1">Cash</p>
              <p className="text-base font-bold tabular-nums">${membership.cash_balance?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800/40">
            <p className="text-zinc-500 text-xs font-medium mb-1">Return</p>
            <p className={`text-lg font-black tabular-nums ${
              membership.total_return_percent >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {membership.total_return_percent >= 0 ? '+' : ''}
              {membership.total_return_percent?.toFixed(2)}%
            </p>
          </div>
        </div>
      </Link>
      
      {/* Delete button -- only visible to commissioner */}
      {isCommissioner && (
        <div className="absolute top-3 right-3">
          <DeleteLeagueButton leagueId={league.id} />
        </div>
      )}
    </div>
  );
}
