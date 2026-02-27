import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leagueId: string }> }
) {
  const { leagueId } = await params;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol, trade_type, shares, price_per_share } = await request.json();
    const total_amount = shares * price_per_share;

    // Get league member
    const { data: member } = await supabase
      .from("league_members")
      .select("id, cash_balance")
      .eq("league_id", leagueId)
      .eq("user_id", user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Not a league member" }, { status: 403 });
    }

    // Validate trade
    if (trade_type === "buy" && total_amount > member.cash_balance) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Execute trade
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        league_member_id: member.id,
        symbol: symbol.toUpperCase(),
        trade_type,
        shares,
        price_per_share,
        total_amount,
        status: "completed",
      })
      .select()
      .single();

    if (tradeError) throw tradeError;

    // Update cash balance
    const newBalance = trade_type === "buy"
      ? member.cash_balance - total_amount
      : member.cash_balance + total_amount;

    await supabase
      .from("league_members")
      .update({ cash_balance: newBalance })
      .eq("id", member.id);

    // Update portfolio holdings
    const { data: existingHolding } = await supabase
      .from("portfolio_holdings")
      .select("*")
      .eq("league_member_id", member.id)
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (existingHolding) {
      if (trade_type === "buy") {
        const totalShares = existingHolding.shares + shares;
        const totalCost = (existingHolding.shares * existingHolding.average_cost) + total_amount;
        await supabase
          .from("portfolio_holdings")
          .update({
            shares: totalShares,
            average_cost: totalCost / totalShares,
          })
          .eq("id", existingHolding.id);
      } else {
        const newShares = existingHolding.shares - shares;
        if (newShares <= 0) {
          await supabase.from("portfolio_holdings").delete().eq("id", existingHolding.id);
        } else {
          await supabase
            .from("portfolio_holdings")
            .update({ shares: newShares })
            .eq("id", existingHolding.id);
        }
      }
    } else if (trade_type === "buy") {
      await supabase.from("portfolio_holdings").insert({
        league_member_id: member.id,
        symbol: symbol.toUpperCase(),
        shares,
        average_cost: price_per_share,
      });
    }

    return NextResponse.json({ success: true, trade });
  } catch (error: any) {
    console.error("Trade error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
