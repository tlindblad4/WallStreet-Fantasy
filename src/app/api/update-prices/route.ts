import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    
    // Get all unique symbols from portfolio holdings
    const { data: holdings } = await supabase
      .from("portfolio_holdings")
      .select("symbol")
      .order("symbol");
    
    const uniqueSymbols = [...new Set((holdings || []).map(h => h.symbol))];
    
    if (uniqueSymbols.length === 0) {
      return NextResponse.json({ message: "No holdings to update" });
    }
    
    // Fetch prices for all symbols
    const updates = [];
    
    for (const symbol of uniqueSymbols) {
      try {
        // Map common symbols to Finnhub format
        let finnhubSymbol = symbol;
        if (symbol === 'BTC' || symbol === 'BTC-USD') {
          finnhubSymbol = 'BINANCE:BTCUSDT';
        } else if (symbol === 'ETH' || symbol === 'ETH-USD') {
          finnhubSymbol = 'BINANCE:ETHUSDT';
        }
        
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`
        );
        const data = await response.json();
        
        if (data.c && data.c > 0) {
          updates.push({
            symbol,
            price: data.c,
            change: data.d,
            change_percent: data.dp,
            high: data.h,
            low: data.l,
            open: data.o,
            previous_close: data.pc,
            updated_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
      }
    }
    
    // Upsert prices to database
    if (updates.length > 0) {
      const { error } = await supabase
        .from("stock_prices")
        .upsert(updates, { onConflict: "symbol" });
      
      if (error) {
        console.error("Error updating prices:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    
    // Update portfolio holdings current_value
    for (const update of updates) {
      const { error: holdingsError } = await supabase
        .from("portfolio_holdings")
        .update({ current_price: update.price })
        .eq("symbol", update.symbol);
      
      if (holdingsError) {
        console.error(`Error updating holdings for ${update.symbol}:`, holdingsError);
      }
    }
    
    return NextResponse.json({ 
      message: `Updated ${updates.length} prices`,
      symbols: updates.map(u => u.symbol)
    });
    
  } catch (error) {
    console.error("Error in update-prices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
