import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const type = searchParams.get("type") || "stock"; // stock or crypto

  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  try {
    let priceData;

    if (type === "crypto" || symbol.includes(":")) {
      // Crypto quote from Finnhub
      // Format: BINANCE:BTCUSDT
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
      );
      priceData = await response.json();
    } else {
      // Stock quote
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      priceData = await response.json();
    }
    
    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      type: type,
      price: priceData.c,
      change: priceData.d,
      changePercent: priceData.dp,
      high: priceData.h,
      low: priceData.l,
      open: priceData.o,
      previousClose: priceData.pc,
    });
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
