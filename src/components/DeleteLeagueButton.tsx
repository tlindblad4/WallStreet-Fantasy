"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function DeleteLeagueButton({ leagueId }: { leagueId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this league? This cannot be undone.")) return;

    setLoading(true);

    // Delete members first (foreign key constraint)
    await supabase
      .from("league_members")
      .delete()
      .eq("league_id", leagueId);

    // Delete the league
    const { error } = await supabase
      .from("leagues")
      .delete()
      .eq("id", leagueId);

    if (error) {
      alert("Failed to delete league: " + error.message);
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
      title="Delete league"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
