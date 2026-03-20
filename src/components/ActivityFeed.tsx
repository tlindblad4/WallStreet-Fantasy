"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { TrendingUp, UserPlus, Trophy, Target, Activity } from "lucide-react";

interface ActivityItem {
  id: string;
  user_id: string;
  username: string;
  activity_type: 'trade' | 'join' | 'achievement' | 'rank_change' | 'milestone';
  title: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface ActivityFeedProps {
  leagueId: string;
}

export default function ActivityFeed({ leagueId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from("activity_feed")
        .select(`
          id,
          user_id,
          activity_type,
          title,
          description,
          metadata,
          created_at,
          profiles:user_id(username)
        `)
        .eq("league_id", leagueId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setActivities(data.map((a: any) => ({
          ...a,
          username: a.profiles?.username || "Unknown",
        })));
      }
      setLoading(false);
    };

    fetchActivities();

    // Subscribe to new activities
    const supabase = createClient();
    const channel = supabase
      .channel('activity_feed')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'activity_feed',
          filter: `league_id=eq.${leagueId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", payload.new.user_id)
            .single();

          const newActivity: ActivityItem = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            username: profile?.username || "Unknown",
            activity_type: payload.new.activity_type,
            title: payload.new.title,
            description: payload.new.description,
            metadata: payload.new.metadata,
            created_at: payload.new.created_at,
          };

          setActivities(prev => [newActivity, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'join':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'rank_change':
        return <Target className="w-4 h-4 text-purple-400" />;
      case 'milestone':
        return <Activity className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="h-2 bg-zinc-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-emerald-400" />
        <h3 className="font-semibold">Activity Feed</h3>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-center text-zinc-500 py-4">
            No activity yet
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-zinc-800/30 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                {getIcon(activity.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {activity.description}
                </p>
                <p className="text-xs text-zinc-600 mt-1">
                  {formatTime(activity.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
