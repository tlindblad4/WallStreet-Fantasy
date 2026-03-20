import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  hover?: boolean;
}

export function GlassCard({ children, className, gradient = false, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
        "bg-white/[0.03] border-white/[0.08]",
        hover && "transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
        gradient && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-500/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  from?: string;
  to?: string;
}

export function GradientText({ 
  children, 
  className,
  from = "from-emerald-400",
  to = "to-cyan-400"
}: GradientTextProps) {
  return (
    <span className={cn(`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent`, className)}>
      {children}
    </span>
  );
}

interface ShineButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline";
}

export function ShineButton({ 
  children, 
  className, 
  onClick,
  variant = "primary"
}: ShineButtonProps) {
  const variants = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400",
    secondary: "bg-white/10 text-white hover:bg-white/20",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/5",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 font-medium transition-all duration-300",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        variants[variant],
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

export function PremiumStatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-zinc-400",
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={cn("text-sm mt-2", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-white/5">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
