// Finnhub Stock API Service

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${symbol}`);
    }
    
    const data = await response.json();
    
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

export async function searchStocks(query: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search stocks');
    }
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

export async function getCompanyProfile(symbol: string): Promise<any> {
  try {
    const response = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile for ${symbol}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
}

// Batch get quotes for multiple symbols
export async function getBatchQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const quotes = new Map<string, StockQuote>();
  
  // Finnhub free tier doesn't have batch endpoint, so we fetch sequentially
  // In production, you'd want to use a paid tier or cache aggressively
  for (const symbol of symbols) {
    const quote = await getStockQuote(symbol);
    if (quote) {
      quotes.set(symbol.toUpperCase(), quote);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return quotes;
}
