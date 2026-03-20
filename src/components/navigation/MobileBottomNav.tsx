"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Trophy, TrendingUp, User, Plus } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/leagues", icon: Trophy, label: "Leagues" },
    { href: "/leagues/create", icon: Plus, label: "Create", isAction: true },
    { href: "/market", icon: TrendingUp, label: "Market" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb"
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-xs text-zinc-400 mt-1">{item.label}</span>
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center px-4 py-2"
              >
                <div className={`relative ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
