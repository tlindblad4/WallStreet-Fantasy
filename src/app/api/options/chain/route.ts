import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Simulated options chain since free Finnhub tier has limited options support
// In production, you'd use: https://finnhub.io/api/v1/stock/option-chain?symbol=AAPL&token=XXX
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const underlyingPrice = parseFloat(searchParams.get("price") || "0");

  if (!symbol || !underlyingPrice) {
    return NextResponse.json({ error: "Symbol and price required" }, { status: 400 });
  }
  
  try {
    // Get real stock data for the underlying
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const quote = await response.json();
    const currentPrice = quote.c || underlyingPrice;

    // Generate simulated options chain
    // In production, this would come from a real options data provider
    const expirations = generateExpirationDates(4); // Next 4 Fridays
    const strikes = generateStrikePrices(currentPrice);
    
    const optionsChain = expirations.flatMap(expiration => {
      return strikes.flatMap(strike => {
        const timeToExpiry = (new Date(expiration).getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000);
        
        // Simplified Black-Scholes-ish pricing
        const callPrice = calculateOptionPrice(currentPrice, strike, timeToExpiry, 'call');
        const putPrice = calculateOptionPrice(currentPrice, strike, timeToExpiry, 'put');
        
        return [
          {
            symbol: `${symbol}${expiration.replace(/-/g, '').slice(2)}C${Math.round(strike * 1000).toString().padStart(8, '0')}`,
            underlying: symbol,
            type: 'call',
            strike,
            expiration,
            lastPrice: callPrice,
            bid: callPrice * 0.95,
            ask: callPrice * 1.05,
            volume: Math.floor(Math.random() * 1000) + 100,
            openInterest: Math.floor(Math.random() * 5000) + 500,
            impliedVolatility: 0.3 + Math.random() * 0.2,
            delta: calculateDelta(currentPrice, strike, timeToExpiry, 'call'),
            inTheMoney: currentPrice > strike,
          },
          {
            symbol: `${symbol}${expiration.replace(/-/g, '').slice(2)}P${Math.round(strike * 1000).toString().padStart(8, '0')}`,
            underlying: symbol,
            type: 'put',
            strike,
            expiration,
            lastPrice: putPrice,
            bid: putPrice * 0.95,
            ask: putPrice * 1.05,
            volume: Math.floor(Math.random() * 1000) + 100,
            openInterest: Math.floor(Math.random() * 5000) + 500,
            impliedVolatility: 0.3 + Math.random() * 0.2,
            delta: calculateDelta(currentPrice, strike, timeToExpiry, 'put'),
            inTheMoney: currentPrice < strike,
          }
        ];
      });
    });

    return NextResponse.json({
      symbol,
      underlyingPrice: currentPrice,
      expirations,
      strikes,
      options: optionsChain,
    });
  } catch (error) {
    console.error("Options chain error:", error);
    return NextResponse.json({ error: "Failed to fetch options" }, { status: 500 });
  }
}

function generateExpirationDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 1; i <= count; i++) {
    const date = new Date(today);
    // Find next Friday
    const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilFriday + (i - 1) * 7);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

function generateStrikePrices(currentPrice: number): number[] {
  const strikes: number[] = [];
  const step = currentPrice < 50 ? 2.5 : currentPrice < 200 ? 5 : 10;
  const lowerBound = Math.max(step, currentPrice - step * 5);
  const upperBound = currentPrice + step * 5;
  
  for (let strike = lowerBound; strike <= upperBound; strike += step) {
    strikes.push(Math.round(strike * 100) / 100);
  }
  
  return strikes;
}

function calculateOptionPrice(
  underlying: number,
  strike: number,
  timeToExpiry: number,
  type: 'call' | 'put'
): number {
  // Very simplified option pricing (not real Black-Scholes)
  const volatility = 0.3;
  const intrinsic = type === 'call' 
    ? Math.max(0, underlying - strike)
    : Math.max(0, strike - underlying);
  
  // Time value (simplified)
  const timeValue = underlying * volatility * Math.sqrt(timeToExpiry) * 0.4;
  
  return Math.max(0.01, intrinsic + timeValue);
}

function calculateDelta(
  underlying: number,
  strike: number,
  timeToExpiry: number,
  type: 'call' | 'put'
): number {
  // Simplified delta calculation
  const moneyness = (underlying - strike) / strike;
  const timeAdjustment = Math.sqrt(timeToExpiry) * 0.5;
  
  if (type === 'call') {
    return Math.min(1, Math.max(0, 0.5 + moneyness * 5 + timeAdjustment));
  } else {
    return Math.max(-1, Math.min(0, -0.5 + moneyness * 5 - timeAdjustment));
  }
}
