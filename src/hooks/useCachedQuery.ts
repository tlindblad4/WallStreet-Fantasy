"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheItem<any>>();

export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Check cache
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        const result = await fetcher();
        cache.set(key, { data: result, timestamp: Date.now() });
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, deps);

  const refetch = async () => {
    cache.delete(key);
    setLoading(true);
    try {
      const result = await fetcher();
      cache.set(key, { data: result, timestamp: Date.now() });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}

// Preload common data
export function preloadLeagueData(leagueId: string) {
  const supabase = createClient();
  
  // Preload league details
  const leagueKey = `league-${leagueId}`;
  if (!cache.has(leagueKey)) {
    supabase
      .from("leagues")
      .select("*")
      .eq("id", leagueId)
      .single()
      .then(({ data }) => {
        if (data) cache.set(leagueKey, { data, timestamp: Date.now() });
      });
  }
}

// Clear cache for a specific key
export function clearCache(key: string) {
  cache.delete(key);
}

// Clear all cache
export function clearAllCache() {
  cache.clear();
}
