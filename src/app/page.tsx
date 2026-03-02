"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Zap, Shield, ArrowRight, Play, Trophy, BarChart2, Bitcoin } from "lucide-react";
import { useEffect, useState } from "react";
import {
  HeroStockChart,
  PortfolioPerformanceChart,
  VolumeChart,
  LiveActivityFeed,
  MarketMetrics,
} from "@/components/finance-visualizations";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800" : ""
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight">WallStreet Fantasy</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-9 px-4">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold h-9 px-4 rounded-lg">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-28 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Now in Beta — Free to Play</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-none">
            <span className="block text-white">Fantasy Sports.</span>
            <span className="block text-emerald-400">For Stocks.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Start with $100K virtual cash. Trade stocks & crypto (BTC, ETH, SOL). 
            Compete with friends in private leagues. Best portfolio wins.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base px-8 h-12 rounded-xl">
                Start Trading Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-base px-8 h-12 rounded-xl bg-transparent">
              <Play className="mr-2 w-4 h-4" />
              Watch Demo
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-12 mt-20 pt-12 border-t border-zinc-800/60">
            <Stat value="10K+" label="Active Traders" />
            <div className="w-px h-10 bg-zinc-800" />
            <Stat value="$50M+" label="Virtual Trades" />
            <div className="w-px h-10 bg-zinc-800" />
            <Stat value="500+" label="Active Leagues" />
          </div>
        </div>
      </section>

      {/* Market Dashboard Visualizations */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Market Dashboard</h2>
            <p className="text-zinc-400 text-lg">Real-time data powering every trade</p>
          </div>

          {/* Metrics row */}
          <div className="mb-6">
            <MarketMetrics />
          </div>

          {/* Main chart */}
          <div className="mb-6">
            <HeroStockChart />
          </div>

          {/* Two-column: Portfolio + Volume */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <PortfolioPerformanceChart />
            <VolumeChart />
          </div>

          {/* Activity feed */}
          <div className="max-w-2xl mx-auto">
            <LiveActivityFeed />
          </div>
        </div>
      </section>

      {/* Live Tickers */}
      <section className="py-16 px-6 border-y border-zinc-800/60 bg-zinc-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Market Snapshot</h3>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StockTicker symbol="AAPL" name="Apple" price="182.50" change="+2.4" />
            <StockTicker symbol="BTC" name="Bitcoin" price="67,420" change="+3.8" isCrypto />
            <StockTicker symbol="NVDA" name="NVIDIA" price="485.10" change="+5.8" />
            <StockTicker symbol="ETH" name="Ethereum" price="3,520" change="+2.1" isCrypto />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">How It Works</h2>
            <p className="text-zinc-400 text-lg">Up and trading in under 2 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Step number="01" title="Create a League" description="Invite your friends, set season length and starting cash. You're the commissioner." />
            <Step number="02" title="Trade Stocks & Crypto" description="Buy and sell stocks and cryptocurrency using live market prices. BTC, ETH, SOL, and more." />
            <Step number="03" title="Climb the Board" description="Rankings update every minute. The highest portfolio value at season end wins." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-zinc-900/40 border-y border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Everything You Need</h2>
            <p className="text-zinc-400 text-lg">Built for competitive traders</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <FeatureCard
              icon={<Zap className="w-5 h-5 text-emerald-400" />}
              title="Real-Time Prices"
              description="Live market data powering every trade."
            />
            <FeatureCard
              icon={<Bitcoin className="w-5 h-5 text-orange-400" />}
              title="Crypto Trading"
              description="Trade BTC, ETH, SOL, ADA, DOT & more."
            />
            <FeatureCard
              icon={<Users className="w-5 h-5 text-blue-400" />}
              title="Private Leagues"
              description="Invite friends with a simple code."
            />
            <FeatureCard
              icon={<Trophy className="w-5 h-5 text-yellow-400" />}
              title="Live Leaderboard"
              description="Rankings update every 60 seconds."
            />
            <FeatureCard
              icon={<BarChart2 className="w-5 h-5 text-purple-400" />}
              title="Portfolio Analytics"
              description="Track gains, losses, and trade history."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-14">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Ready to compete?
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Create your account in seconds. No credit card required.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base px-10 h-12 rounded-xl">
                Create Free Account
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm">WallStreet Fantasy</span>
          </div>
          <p className="text-xs text-zinc-600">
            © 2026 WallStreet Fantasy. All rights reserved. Virtual trading only — not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

function StockTicker({ symbol, name, price, change, isCrypto }: {
  symbol: string; name: string; price: string; change: string; isCrypto?: boolean;
}) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm">{symbol}</span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
          isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {change}%
        </span>
      </div>
      <div className="text-xs text-zinc-500 mb-2">{name}</div>
      <div className="text-base font-bold">${price}</div>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden">
      <div className="text-6xl font-black text-zinc-800 absolute top-4 right-6 leading-none select-none">
        {number}
      </div>
      <div className="relative">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-1 text-sm">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
