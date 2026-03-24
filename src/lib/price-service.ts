// Live price fetching service with proper symbol mapping
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "d6gttihr01qg85h02hi0d6gttihr01qg85h02hig";

// Symbol mapping for common assets
const SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BINANCE:BTCUSDT',
  'BTC-USD': 'BINANCE:BTCUSDT',
  'ETH': 'BINANCE:ETHUSDT',
  'ETH-USD': 'BINANCE:ETHUSDT',
  'SOL': 'BINANCE:SOLUSDT',
  'SOL-USD': 'BINANCE:SOLUSDT',
  'ADA': 'BINANCE:ADAUSDT',
  'ADA-USD': 'BINANCE:ADAUSDT',
  'DOT': 'BINANCE:DOTUSDT',
  'DOT-USD': 'BINANCE:DOTUSDT',
  'AVAX': 'BINANCE:AVAXUSDT',
  'AVAX-USD': 'BINANCE:AVAXUSDT',
  'MATIC': 'BINANCE:MATICUSDT',
  'MATIC-USD': 'BINANCE:MATICUSDT',
  'LINK': 'BINANCE:LINKUSDT',
  'LINK-USD': 'BINANCE:LINKUSDT',
  'UNI': 'BINANCE:UNIUSDT',
  'UNI-USD': 'BINANCE:UNIUSDT',
  'AAVE': 'BINANCE:AAVEUSDT',
  'AAVE-USD': 'BINANCE:AAVEUSDT',
  'SUSHI': 'BINANCE:SUSHIUSDT',
  'SUSHI-USD': 'BINANCE:SUSHIUSDT',
  'COMP': 'BINANCE:COMPUSDT',
  'COMP-USD': 'BINANCE:COMPUSDT',
  'MKR': 'BINANCE:MKRUSDT',
  'MKR-USD': 'BINANCE:MKRUSDT',
  'YFI': 'BINANCE:YFIUSDT',
  'YFI-USD': 'BINANCE:YFIUSDT',
  'SNX': 'BINANCE:SNXUSDT',
  'SNX-USD': 'BINANCE:SNXUSDT',
  'CRV': 'BINANCE:CRVUSDT',
  'CRV-USD': 'BINANCE:CRVUSDT',
  '1INCH': 'BINANCE:1INCHUSDT',
  '1INCH-USD': 'BINANCE:1INCHUSDT',
  'BAT': 'BINANCE:BATUSDT',
  'BAT-USD': 'BINANCE:BATUSDT',
  'ENJ': 'BINANCE:ENJUSDT',
  'ENJ-USD': 'BINANCE:ENJUSDT',
  'MANA': 'BINANCE:MANAUSDT',
  'MANA-USD': 'BINANCE:MANAUSDT',
  'SAND': 'BINANCE:SANDUSDT',
  'SAND-USD': 'BINANCE:SANDUSDT',
  'AXS': 'BINANCE:AXSUSDT',
  'AXS-USD': 'BINANCE:AXSUSDT',
  'GRT': 'BINANCE:GRTUSDT',
  'GRT-USD': 'BINANCE:GRTUSDT',
  'LDO': 'BINANCE:LDOUSDT',
  'LDO-USD': 'BINANCE:LDOUSDT',
  'OP': 'BINANCE:OPUSDT',
  'OP-USD': 'BINANCE:OPUSDT',
  'ARB': 'BINANCE:ARBUSDT',
  'ARB-USD': 'BINANCE:ARBUSDT',
  'APT': 'BINANCE:APTUSDT',
  'APT-USD': 'BINANCE:APTUSDT',
  'SUI': 'BINANCE:SUIUSDT',
  'SUI-USD': 'BINANCE:SUIUSDT',
  'SEI': 'BINANCE:SEIUSDT',
  'SEI-USD': 'BINANCE:SEIUSDT',
  'TIA': 'BINANCE:TIAUSDT',
  'TIA-USD': 'BINANCE:TIAUSDT',
  'DYDX': 'BINANCE:DYDXUSDT',
  'DYDX-USD': 'BINANCE:DYDXUSDT',
  'PENDLE': 'BINANCE:PENDLEUSDT',
  'PENDLE-USD': 'BINANCE:PENDLEUSDT',
  'STRK': 'BINANCE:STRKUSDT',
  'STRK-USD': 'BINANCE:STRKUSDT',
};

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

/**
 * Map a symbol to Finnhub format
 */
export function mapSymbol(symbol: string): string {
  return SYMBOL_MAP[symbol.toUpperCase()] || symbol;
}

/**
 * Check if a symbol is a cryptocurrency
 */
export function isCrypto(symbol: string): boolean {
  const mapped = mapSymbol(symbol);
  return mapped.includes('BINANCE') || mapped.includes('COINBASE');
}

/**
 * Fetch live price for a single symbol
 */
export async function fetchPrice(symbol: string): Promise<PriceData | null> {
  try {
    const finnhubSymbol = mapSymbol(symbol);
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch price for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.c || data.c <= 0) {
      console.error(`Invalid price data for ${symbol}:`, data);
      return null;
    }
    
    return {
      symbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch live prices for multiple symbols
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  // Fetch in parallel but handle errors individually
  const promises = symbols.map(async (symbol) => {
    const price = await fetchPrice(symbol);
    if (price) {
      results[symbol] = price;
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Fetch company profile (stocks only)
 */
export async function fetchCompanyProfile(symbol: string) {
  // Skip for crypto
  if (isCrypto(symbol)) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch basic financials (stocks only)
 */
export async function fetchFinancials(symbol: string) {
  // Skip for crypto
  if (isCrypto(symbol)) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching financials for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch news (stocks only)
 */
export async function fetchNews(symbol: string, days: number = 7) {
  // Skip for crypto
  if (isCrypto(symbol)) {
    return [];
  }
  
  try {
    const today = new Date();
    const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    
    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.slice(0, 5); // Return top 5 news items
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch recommendation trends (stocks only)
 */
export async function fetchRecommendations(symbol: string) {
  // Skip for crypto
  if (isCrypto(symbol)) {
    return [];
  }
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/recommendation?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) return [];
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching recommendations for ${symbol}:`, error);
    return [];
  }
}
