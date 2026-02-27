import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    
    return NextResponse.json({ results: data.result || [] });
  } catch (error) {
    console.error("Stock search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
