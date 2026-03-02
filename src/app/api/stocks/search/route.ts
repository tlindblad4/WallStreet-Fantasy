import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Popular crypto symbols for quick access
const CRYPTO_SYMBOLS = [
  { symbol: "BINANCE:BTCUSDT", description: "Bitcoin", type: "crypto", displaySymbol: "BTC" },
  { symbol: "BINANCE:ETHUSDT", description: "Ethereum", type: "crypto", displaySymbol: "ETH" },
  { symbol: "BINANCE:SOLUSDT", description: "Solana", type: "crypto", displaySymbol: "SOL" },
  { symbol: "BINANCE:ADAUSDT", description: "Cardano", type: "crypto", displaySymbol: "ADA" },
  { symbol: "BINANCE:DOTUSDT", description: "Polkadot", type: "crypto", displaySymbol: "DOT" },
  { symbol: "BINANCE:MATICUSDT", description: "Polygon", type: "crypto", displaySymbol: "MATIC" },
  { symbol: "BINANCE:AVAXUSDT", description: "Avalanche", type: "crypto", displaySymbol: "AVAX" },
  { symbol: "BINANCE:LINKUSDT", description: "Chainlink", type: "crypto", displaySymbol: "LINK" },
  { symbol: "BINANCE:UNIUSDT", description: "Uniswap", type: "crypto", displaySymbol: "UNI" },
  { symbol: "BINANCE:LTCUSDT", description: "Litecoin", type: "crypto", displaySymbol: "LTC" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "all"; // all, stock, crypto

  try {
    let results: any[] = [];

    // Search stocks via Finnhub
    if (type === "all" || type === "stock") {
      if (query) {
        const response = await fetch(
          `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
        );
        const data = await response.json();
        
        if (data.result) {
          // Filter to US stocks and add type
          const stocks = data.result
            .filter((item: any) => item.type === "Common Stock" && (item.symbol.includes(".") === false))
            .map((item: any) => ({
              ...item,
              type: "stock",
              displaySymbol: item.symbol,
            }))
            .slice(0, 10);
          
          results = [...results, ...stocks];
        }
      }
    }

    // Search crypto
    if (type === "all" || type === "crypto") {
      if (query) {
        // Filter crypto by search query
        const matchingCrypto = CRYPTO_SYMBOLS.filter(
          (crypto) =>
            crypto.displaySymbol.toLowerCase().includes(query.toLowerCase()) ||
            crypto.description.toLowerCase().includes(query.toLowerCase())
        );
        results = [...results, ...matchingCrypto];
      } else {
        // Return top crypto if no query
        results = [...results, ...CRYPTO_SYMBOLS.slice(0, 5)];
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
