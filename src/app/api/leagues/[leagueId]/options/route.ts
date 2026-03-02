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

    const {
      underlying_symbol,
      option_type,
      strike_price,
      expiration_date,
      contracts,
      premium_per_contract,
    } = await request.json();

    // Validate inputs
    if (!underlying_symbol || !option_type || !strike_price || !expiration_date || !contracts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (contracts < 1 || contracts > 100) {
      return NextResponse.json({ error: "Invalid contract amount (1-100)" }, { status: 400 });
    }

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

    // Check if options trading is allowed in this league
    const { data: league } = await supabase
      .from("leagues")
      .select("allow_options_trading")
      .eq("id", leagueId)
      .single();

    if (!league?.allow_options_trading) {
      return NextResponse.json({ error: "Options trading not enabled in this league" }, { status: 403 });
    }

    const totalPremium = premium_per_contract * contracts;

    // Validate sufficient funds
    if (totalPremium > member.cash_balance) {
      return NextResponse.json({ error: "Insufficient funds for option premium" }, { status: 400 });
    }

    // Create option contract
    const { data: option, error: optionError } = await supabase
      .from("options_contracts")
      .insert({
        league_member_id: member.id,
        underlying_symbol: underlying_symbol.toUpperCase(),
        option_type,
        strike_price,
        expiration_date,
        contracts,
        premium_paid: premium_per_contract,
        total_premium: totalPremium,
        status: "active",
      })
      .select()
      .single();

    if (optionError) throw optionError;

    // Deduct premium from cash balance
    const newBalance = member.cash_balance - totalPremium;
    await supabase
      .from("league_members")
      .update({ cash_balance: newBalance })
      .eq("id", member.id);

    return NextResponse.json({ success: true, option });
  } catch (error: any) {
    console.error("Options trade error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
