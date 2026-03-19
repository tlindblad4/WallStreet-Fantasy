"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Trophy, Star, Target, TrendingUp, Users, Award, Lock } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
}

const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Complete your first trade',
    icon: 'target',
    requirement: 1,
  },
  {
    id: 'trader_10',
    name: 'Active Trader',
    description: 'Complete 10 trades',
    icon: 'trending',
    requirement: 10,
  },
  {
    id: 'profit_10k',
    name: 'Profit Maker',
    description: 'Make $10,000 in profit',
    icon: 'star',
    requirement: 10000,
  },
  {
    id: 'profit_50k',
    name: 'Big Winner',
    description: 'Make $50,000 in profit',
    icon: 'trophy',
    requirement: 50000,
  },
  {
    id: 'join_league',
    name: 'Team Player',
    description: 'Join your first league',
    icon: 'users',
    requirement: 1,
  },
  {
    id: 'rank_1',
    name: 'Champion',
    description: 'Reach #1 in a league',
    icon: 'award',
    requirement: 1,
  },
];

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      // Get user's stats
      const { data: trades } = await supabase
        .from("trades")
        .select("type, quantity, price")
        .eq("user_id", user.id);

      const { data: memberships } = await supabase
        .from("league_members")
        .select("current_rank, total_return")
        .eq("user_id", user.id);

      // Calculate progress
      const tradeCount = trades?.length || 0;
      const totalProfit = memberships?.reduce((sum, m) => sum + (m.total_return || 0), 0) || 0;
      const leagueCount = memberships?.length || 0;
      const hasRank1 = memberships?.some(m => m.current_rank === 1) || false;

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

      const computedAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
        let progress = 0;
        
        switch (def.id) {
          case 'first_trade':
          case 'trader_10':
            progress = tradeCount;
            break;
          case 'profit_10k':
          case 'profit_50k':
            progress = totalProfit;
            break;
          case 'join_league':
            progress = leagueCount;
            break;
          case 'rank_1':
            progress = hasRank1 ? 1 : 0;
            break;
        }

        const userAchievement = userAchievements?.find(ua => ua.achievement_id === def.id);

        return {
          ...def,
          unlocked: unlockedIds.has(def.id),
          unlocked_at: userAchievement?.unlocked_at,
          progress: Math.min(progress, def.requirement),
        };
      });

      setAchievements(computedAchievements);
      setLoading(false);
    };

    fetchAchievements();
  }, []);

  const getIcon = (iconName: string, unlocked: boolean) => {
    const className = unlocked ? "w-8 h-8 text-yellow-400" : "w-8 h-8 text-zinc-600";
    
    switch (iconName) {
      case 'target':
        return <Target className={className} />;
      case 'trending':
        return <TrendingUp className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'trophy':
        return <Trophy className={className} />;
      case 'users':
        return <Users className={className} />;
      case 'award':
        return <Award className={className} />;
      default:
        return <Trophy className={className} />;
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-zinc-800 rounded" />
            <div className="h-24 bg-zinc-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Achievements</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {unlockedCount} of {achievements.length} unlocked
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 rounded-xl border transition-all ${
              achievement.unlocked
                ? 'bg-yellow-500/5 border-yellow-500/20'
                : 'bg-zinc-800/30 border-zinc-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                achievement.unlocked ? 'bg-yellow-500/10' : 'bg-zinc-800'
              }`}>
                {getIcon(achievement.icon, achievement.unlocked)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${
                    achievement.unlocked ? 'text-white' : 'text-zinc-500'
                  }`}>
                    {achievement.name}
                  </h3>
                  {!achievement.unlocked && <Lock className="w-3 h-3 text-zinc-600" />}
                </div>
                <p className="text-xs text-zinc-500 mt-1">{achievement.description}</p>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        achievement.unlocked ? 'bg-yellow-400' : 'bg-zinc-600'
                      }`}
                      style={{
                        width: `${(achievement.progress / achievement.requirement) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    {achievement.progress} / {achievement.requirement}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
