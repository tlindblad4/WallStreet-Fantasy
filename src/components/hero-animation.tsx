"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// --- Particle System ---

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
}

function MarketParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const spawnParticle = useCallback((width: number, height: number): Particle => {
    const colors = [
      "rgba(16, 185, 129,",  // emerald
      "rgba(34, 197, 94,",   // green
      "rgba(20, 184, 166,",  // teal
      "rgba(6, 182, 212,",   // cyan
    ];
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 200,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < 60; i++) {
      const p = spawnParticle(rect.width, rect.height);
      p.life = Math.random() * p.maxLife;
      particlesRef.current.push(p);
    }

    const animate = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);

      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeFactor = 1 - p.life / p.maxLife;
        const currentOpacity = p.opacity * lifeFactor;

        if (p.life >= p.maxLife || p.y < -10 || p.x < -10 || p.x > r.width + 10) {
          particlesRef.current[i] = spawnParticle(r.width, r.height);
          particlesRef.current[i].y = r.height + 10;
          return;
        }

        // Draw glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentOpacity * 0.15})`;
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${currentOpacity})`;
        ctx.fill();
      });

      // Draw faint connection lines between close particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            const lineOpacity = (1 - dist / 100) * 0.06;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [spawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}

// --- Live Stock Line (Canvas-drawn) ---

function LiveStockLine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pricesRef = useRef<number[]>([]);
  const animFrameRef = useRef<number>(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seed price data
    let price = 185;
    for (let i = 0; i < 200; i++) {
      price += (Math.random() - 0.47) * 1.5;
      price = Math.max(price, 170);
      price = Math.min(price, 200);
      pricesRef.current.push(price);
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);

      frameCountRef.current++;
      // Add new price every 2 frames
      if (frameCountRef.current % 2 === 0) {
        const last = pricesRef.current[pricesRef.current.length - 1];
        const change = (Math.random() - 0.47) * 1.2;
        let newPrice = last + change;
        newPrice = Math.max(newPrice, 170);
        newPrice = Math.min(newPrice, 200);
        pricesRef.current.push(newPrice);
        if (pricesRef.current.length > 200) pricesRef.current.shift();
      }

      const prices = pricesRef.current;
      const minP = Math.min(...prices) - 2;
      const maxP = Math.max(...prices) + 2;
      const w = r.width;
      const h = r.height;
      const padding = 20;

      const getX = (i: number) => (i / (prices.length - 1)) * w;
      const getY = (p: number) => padding + ((maxP - p) / (maxP - minP)) * (h - padding * 2);

      // Gradient fill under line
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.12)");
      gradient.addColorStop(0.7, "rgba(16, 185, 129, 0.02)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0)");

      ctx.beginPath();
      ctx.moveTo(getX(0), h);
      for (let i = 0; i < prices.length; i++) {
        ctx.lineTo(getX(i), getY(prices[i]));
      }
      ctx.lineTo(getX(prices.length - 1), h);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Main line
      ctx.beginPath();
      for (let i = 0; i < prices.length; i++) {
        const x = getX(i);
        const y = getY(prices[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow line
      ctx.beginPath();
      for (let i = 0; i < prices.length; i++) {
        const x = getX(i);
        const y = getY(prices[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Pulse dot at end
      const lastX = getX(prices.length - 1);
      const lastY = getY(prices[prices.length - 1]);
      const pulseRadius = 4 + Math.sin(frameCountRef.current * 0.05) * 2;

      // Outer glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
      ctx.fill();

      // Mid glow
      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseRadius + 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();

      // Horizontal grid lines (subtle)
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding + (i / 4) * (h - padding * 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// --- Floating Portfolio Cards ---

interface CardData {
  symbol: string;
  name: string;
  price: string;
  change: string;
  isUp: boolean;
}

// Pre-computed sparkline heights to avoid hydration mismatch from Math.random()
const SPARKLINES: number[][] = [
  [8, 10, 6, 12, 9, 14, 7, 11, 15, 10, 13, 16],
  [5, 8, 12, 10, 14, 9, 16, 11, 8, 13, 15, 17],
  [12, 9, 7, 14, 11, 16, 8, 13, 10, 15, 12, 18],
  [10, 14, 8, 6, 11, 9, 13, 7, 15, 10, 8, 5],
  [6, 9, 13, 11, 8, 15, 10, 14, 12, 16, 9, 14],
  [14, 11, 8, 16, 12, 9, 15, 13, 10, 17, 14, 18],
];

const CARDS: CardData[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: "$182.52", change: "+2.4%", isUp: true },
  { symbol: "BTC", name: "Bitcoin", price: "$67,420", change: "+3.8%", isUp: true },
  { symbol: "NVDA", name: "NVIDIA", price: "$485.10", change: "+5.8%", isUp: true },
  { symbol: "TSLA", name: "Tesla", price: "$248.90", change: "-1.2%", isUp: false },
  { symbol: "ETH", name: "Ethereum", price: "$3,520", change: "+2.1%", isUp: true },
  { symbol: "SOL", name: "Solana", price: "$142.80", change: "+7.2%", isUp: true },
];

function FloatingCards() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Position cards in a scattered arrangement
  const positions = [
    { x: -8, y: 8, delay: 0, duration: 5.5 },
    { x: 65, y: 3, delay: 0.8, duration: 6.2 },
    { x: 20, y: 55, delay: 1.4, duration: 5.8 },
    { x: 75, y: 50, delay: 0.4, duration: 6.5 },
    { x: -5, y: 72, delay: 1.8, duration: 5.2 },
    { x: 55, y: 78, delay: 1.0, duration: 6.0 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {CARDS.map((card, i) => {
        const pos = positions[i];
        return (
          <div
            key={card.symbol}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              opacity: mounted ? 1 : 0,
              transform: mounted
                ? "translateY(0px) scale(1)"
                : "translateY(30px) scale(0.9)",
              transition: `opacity 0.8s ease ${pos.delay}s, transform 0.8s ease ${pos.delay}s`,
              animation: mounted
                ? `heroFloat ${pos.duration}s ease-in-out ${pos.delay}s infinite`
                : "none",
            }}
          >
            <div
              className={`relative backdrop-blur-xl rounded-xl border px-3 py-2 sm:px-4 sm:py-3 min-w-[120px] sm:min-w-[150px] shadow-2xl ${i >= 4 ? "hidden sm:block" : ""}`}
              style={{
                background: "rgba(24, 24, 27, 0.7)",
                borderColor: card.isUp
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                boxShadow: card.isUp
                  ? "0 8px 32px rgba(16, 185, 129, 0.06), 0 0 0 1px rgba(16, 185, 129, 0.05)"
                  : "0 8px 32px rgba(239, 68, 68, 0.06), 0 0 0 1px rgba(239, 68, 68, 0.05)",
              }}
            >
              {/* Subtle top accent line */}
              <div
                className="absolute top-0 left-3 right-3 h-px"
                style={{
                  background: card.isUp
                    ? "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)"
                    : "linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.3), transparent)",
                }}
              />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">{card.symbol}</span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                        card.isUp
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {card.change}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{card.name}</span>
                </div>
                <span className="text-sm font-bold text-white tabular-nums">{card.price}</span>
              </div>

              {/* Mini sparkline decoration */}
              <div className="mt-2 h-[18px] flex items-end gap-[2px]">
                {SPARKLINES[i].map((h, j) => (
                  <div
                    key={j}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h}px`,
                      background: card.isUp
                        ? `rgba(16, 185, 129, ${0.15 + (j / 12) * 0.35})`
                        : `rgba(239, 68, 68, ${0.15 + (j / 12) * 0.35})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Scan Line Effect ---

function ScanLines() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.015]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
      }}
    />
  );
}

// --- Main Hero Export ---

export function HeroAnimation() {
  return (
    <div className="relative w-full h-[350px] sm:h-[500px] md:h-[650px] overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800/40 bg-zinc-950">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(16, 185, 129, 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Animated stock chart background */}
      <LiveStockLine />

      {/* Particles */}
      <MarketParticles />

      {/* Floating cards */}
      <FloatingCards />

      {/* CRT scan lines */}
      <ScanLines />

      {/* Vignette edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.8) 0%, transparent 20%, transparent 80%, rgba(9,9,11,0.9) 100%), linear-gradient(90deg, rgba(9,9,11,0.5) 0%, transparent 15%, transparent 85%, rgba(9,9,11,0.5) 100%)",
        }}
      />

      {/* Center label overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 mb-3 opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.3em]">
            Live Market Feed
          </span>
        </div>
        <div className="text-3xl sm:text-5xl md:text-7xl font-black text-white/[0.07] tracking-tighter select-none">
          WALLSTREET
        </div>
      </div>
    </div>
  );
}
