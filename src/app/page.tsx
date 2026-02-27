"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Zap, Shield, ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : ""
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold">WSF</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                How it Works
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-green-500 hover:bg-green-600 text-black font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-slide-up">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-gray-300">Now in Beta</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <span className="block">Trade.</span>
              <span className="block text-gradient">Compete.</span>
              <span className="block">Win.</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              The fantasy sports of investing. Start with $100K virtual cash, 
              trade real stocks, and compete with friends.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Link href="/register">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold text-lg px-8 h-14 rounded-full">
                  Start Trading Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-full">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto mt-20 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Stat value="10K+" label="Active Traders" />
            <Stat value="$50M+" label="Virtual Trades" />
            <Stat value="500+" label="Active Leagues" />
          </div>
        </div>
      </section>

      {/* Live Market Preview */}
      <section className="py-20 px-4 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="glass rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Trending Stocks</h3>
              <span className="text-sm text-gray-400">Live Market Data</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StockTicker symbol="AAPL" name="Apple" price="182.50" change="+2.4" />
              <StockTicker symbol="TSLA" name="Tesla" price="242.30" change="-1.2" />
              <StockTicker symbol="NVDA" name="NVIDIA" price="485.10" change="+5.8" />
              <StockTicker symbol="MSFT" name="Microsoft" price="378.90" change="+1.1" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-400">Built for the modern trader</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Zap className="w-8 h-8 text-green-400" />}
              title="Real-Time Trading"
              description="Execute trades instantly with real market prices. No delays, no fake data."
            />
            <FeatureCard
              icon={<Users className="w-8 h-8 text-blue-400" />}
              title="Private Leagues"
              description="Create leagues with friends. Set your own rules and compete for the top spot."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-purple-400" />}
              title="Risk-Free Learning"
              description="Trade with virtual money. Learn investing without risking real cash."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to start trading?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of traders competing in stock market leagues.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-black font-semibold text-lg px-10 h-14 rounded-full">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold">WallStreet Fantasy</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026 WallStreet Fantasy. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-gradient">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function StockTicker({ symbol, name, price, change }: { symbol: string; name: string; price: string; change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">{symbol}</span>
        <span className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
          {change}%
        </span>
      </div>
      <div className="text-sm text-gray-400">{name}</div>
      <div className="text-lg font-semibold mt-1">${price}</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group">
      <div className="mb-4 transform group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
