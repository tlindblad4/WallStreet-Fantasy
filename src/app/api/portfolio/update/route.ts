import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  try {
    const { leagueMemberId } = await request.json();

    if (!leagueMemberId) {
      return NextResponse.json({ error: "League member ID required" }, { status: 400 });
    }

    // Get all holdings for this member
    const { data: holdings, error: holdingsError } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("league_member_id", leagueMemberId);

    if (holdingsError) throw holdingsError;
    if (!holdings || holdings.length === 0) {
      return NextResponse.json({ updated: 0, message: "No holdings to update" });
    }

    // Get unique symbols
    const symbols = [...new Set(holdings.map(h => h.symbol))];
    
    // Fetch current prices for all symbols
    const priceUpdates: Record<string, number> = {};
    
    for (const symbol of symbols) {
      try {
        // Check if it's crypto (contains : in symbol)
        const isCrypto = symbol.includes(":");
        
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
        );
        const data = await response.json();
        
        if (data.c && data.c > 0) {
          priceUpdates[symbol] = data.c;
        }
      } catch (err) {
        console.error(`Failed to fetch price for ${symbol}:`, err);
      }
    }

    // Update each holding with current price
    let totalHoldingsValue = 0;
    
    for (const holding of holdings) {
      const currentPrice = priceUpdates[holding.symbol] || holding.current_price || holding.average_cost;
      const currentValue = holding.shares * currentPrice;
      const costBasis = holding.shares * holding.average_cost;
      const unrealizedGainLoss = currentValue - costBasis;
      const unrealizedGainLossPercent = costBasis > 0 ? (unrealizedGainLoss / costBasis) * 100 : 0;

      await supabase
        .from("portfolio_holdings")
        .update({
          current_price: currentPrice,
          current_value: currentValue,
          unrealized_gain_loss: unrealizedGainLoss,
          unrealized_gain_loss_percent: unrealizedGainLossPercent,
          last_updated: new Date().toISOString(),
        })
        .eq("id", holding.id);

      totalHoldingsValue += currentValue;
    }

    // Get member's cash balance
    const { data: member } = await supabase
      .from("league_members")
      .select("cash_balance, starting_balance")
      .eq("id", leagueMemberId)
      .single();

    if (member) {
      const totalValue = member.cash_balance + totalHoldingsValue;
      const startingBalance = 100000; // Default, could be fetched from league
      const totalReturn = totalValue - startingBalance;
      const totalReturnPercent = startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;

      // Update member totals
      await supabase
        .from("league_members")
        .update({
          total_value: totalValue,
          total_return: totalReturn,
          total_return_percent: totalReturnPercent,
        })
        .eq("id", leagueMemberId);
    }

    return NextResponse.json({
      updated: holdings.length,
      prices: priceUpdates,
      totalValue: member ? member.cash_balance + totalHoldingsValue : null,
    });
  } catch (error: any) {
    console.error("Portfolio update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Update all portfolios in a league (for leaderboard refresh)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get("leagueId");

  if (!leagueId) {
    return NextResponse.json({ error: "League ID required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  try {
    // Get all members in the league
    const { data: members } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", leagueId)
      .eq("status", "active");

    if (!members || members.length === 0) {
      return NextResponse.json({ updated: 0 });
    }

    // Update each member's portfolio
    const results = [];
    for (const member of members) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/portfolio/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueMemberId: member.id }),
      });
      
      if (response.ok) {
        const result = await response.json();
        results.push({ memberId: member.id, ...result });
      }
    }

    // Recalculate rankings
    await recalculateRankings(supabase, leagueId);

    return NextResponse.json({
      updated: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Bulk portfolio update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function recalculateRankings(supabase: any, leagueId: string) {
  // Get all members sorted by total value
  const { data: members } = await supabase
    .from("league_members")
    .select("id, total_value")
    .eq("league_id", leagueId)
    .eq("status", "active")
    .order("total_value", { ascending: false });

  if (!members) return;

  // Update rankings
  for (let i = 0; i < members.length; i++) {
    await supabase
      .from("league_members")
      .update({ current_rank: i + 1 })
      .eq("id", members[i].id);
  }
}
