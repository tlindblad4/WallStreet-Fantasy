import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, ArrowRight } from "lucide-react";

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
    .eq("league_member_id", member?.id)
    .order("current_value", { ascending: false });

  // Get invite code
  const { data: invite } = await supabase
    .from("league_invites")
    .select("invite_code")
    .eq("league_id", leagueId)
    .single();

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
            <div className="w-16" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Portfolio Value"
            value={`$${member?.total_value?.toLocaleString() || "0"}`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            label="Cash"
            value={`$${member?.cash_balance?.toLocaleString() || "0"}`}
            icon={<span className="text-lg">$</span>}
          />
          <StatCard
            label="Return"
            value={`${member?.total_return_percent >= 0 ? "+" : ""}${member?.total_return_percent?.toFixed(1) || "0"}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            positive={member?.total_return_percent >= 0}
          />
          <StatCard
            label="Rank"
            value={`#${member?.current_rank || "-"}`}
            icon={<Trophy className="w-5 h-5" />}
          />
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

        {/* Invite Code */}
        {invite && (
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">Invite Code</p>
            <code className="text-xl font-mono font-bold">{invite.invite_code}</code>
            <p className="text-xs text-gray-500 mt-1">Share with friends to join</p>
          </div>
        )}

        {/* Holdings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Portfolio</h2>
          {holdings && holdings.length > 0 ? (
            <div className="space-y-2">
              {holdings.map((holding) => (
                <div
                  key={holding.symbol}
                  className="bg-white/5 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold">{holding.symbol}</p>
                    <p className="text-sm text-gray-400">{holding.shares} shares @ ${holding.average_cost?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${holding.current_value?.toFixed(2)}</p>
                    <p className={`text-sm ${holding.unrealized_gain_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {holding.unrealized_gain_loss >= 0 ? "+" : ""}${holding.unrealized_gain_loss?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl">
              <p className="text-gray-400">No holdings yet</p>
              <Link href={`/leagues/${leagueId}/trade`}>
                <Button className="mt-4 bg-green-500 hover:bg-green-600 text-black">
                  Start Trading
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  positive 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-xl font-bold ${positive !== undefined ? (positive ? "text-green-400" : "text-red-400") : ""}`}>
        {value}
      </p>
    </div>
  );
}
