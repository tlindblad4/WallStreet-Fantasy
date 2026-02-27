import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, Users, TrendingUp, Plus } from "lucide-react";
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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              WallStreet Fantasy
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-400">{session.user.email}</span>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Leagues"
            value={leagues.length.toString()}
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
          />
          <StatCard
            title="Total Portfolio Value"
            value={`$${leagues.reduce((sum, l) => sum + (l.total_value || 0), 0).toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          />
          <StatCard
            title="Avg. Return"
            value={`${(leagues.reduce((sum, l) => sum + (l.total_return_percent || 0), 0) / (leagues.length || 1)).toFixed(1)}%`}
            icon={<Users className="w-6 h-6 text-blue-400" />}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Link href="/leagues/create">
            <Button className="bg-blue-600 hover:bg-blue-700">
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
          {leagues.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No leagues yet</h3>
              <p className="text-slate-400 mb-6">
                Create your first league or join one to start competing!
              </p>
              <Link href="/leagues/create">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create Your First League
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{league.name}</h3>
              <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                league.status === 'active' ? 'bg-green-500/20 text-green-400' :
                league.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-slate-700 text-slate-400'
              }`}>
                {league.status}
              </span>
            </div>
            {membership.current_rank && (
              <div className="text-right">
                <span className="text-2xl font-bold text-yellow-400">#{membership.current_rank}</span>
                <p className="text-xs text-slate-400">rank</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-800">
            <div>
              <p className="text-slate-400 text-sm">Portfolio Value</p>
              <p className="text-lg font-semibold">${membership.total_value?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Cash</p>
              <p className="text-lg font-semibold">${membership.cash_balance?.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-slate-400 text-sm">Return</p>
            <p className={`text-lg font-semibold ${
              membership.total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'
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
