"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function TestInviteLookup() {
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testLookup = async () => {
      setLoading(true);
      const supabase = createClient();
      
      // Test 1: List all codes
      const { data: allCodes, error: listError } = await supabase
        .from("league_invites")
        .select("invite_code")
        .limit(10);
      
      console.log("All codes:", allCodes);
      console.log("List error:", listError);
      
      if (allCodes) {
        setCodes(allCodes.map(c => c.invite_code));
      }
      
      if (listError) {
        setError(listError.message);
      }
      
      // Test 2: Lookup specific code
      const { data: specificCode, error: specificError } = await supabase
        .from("league_invites")
        .select("*")
        .eq("invite_code", "A58B3FB6")
        .maybeSingle();
      
      console.log("Specific code A58B3FB6:", specificCode);
      console.log("Specific error:", specificError);
      
      setLoading(false);
    };
    
    testLookup();
  }, []);

  return (
    <div className="p-8 bg-zinc-900 rounded-xl">
      <h2 className="text-xl font-bold mb-4">Invite Code Lookup Test</h2>
      
      {loading && <p className="text-yellow-400">Loading...</p>}
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-zinc-400 mb-2">Available Codes ({codes.length}):</p>
        <div className="flex flex-wrap gap-2">
          {codes.map(code => (
            <span key={code} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded font-mono">
              {code}
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-sm text-zinc-500">
        Check browser console for detailed logs
      </p>
    </div>
  );
}
