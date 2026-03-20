import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  loading?: boolean;
}

export function PremiumButton({ 
  children, 
  className, 
  onClick,
  variant = "primary",
  size = "md",
  icon,
  loading = false
}: PremiumButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    outline: "bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative overflow-hidden rounded-xl font-semibold transition-all duration-300",
        "flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      {loading ? (
        <motion.div
          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <>
          {icon && <span className="relative z-10">{icon}</span>}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </motion.button>
  );
}

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  pulse?: boolean;
}

export function PremiumBadge({ 
  children, 
  className,
  variant = "neutral",
  pulse = false
}: BadgeProps) {
  const variants = {
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    neutral: "bg-white/10 text-zinc-400 border-white/20",
  };

  return (
    <motion.span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      animate={pulse ? {
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1],
      } : {}}
      transition={pulse ? {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      } : {}}
    >
      {children}
    </motion.span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  gradient?: boolean;
}

export function PremiumProgressBar({ 
  value, 
  max = 100, 
  className,
  showValue = false,
  size = "md",
  gradient = true
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("bg-zinc-800 rounded-full overflow-hidden", sizes[size])}>
        <motion.div
          className={cn(
            "h-full rounded-full",
            gradient 
              ? "bg-gradient-to-r from-emerald-500 to-cyan-500" 
              : "bg-emerald-500"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between mt-1 text-xs text-zinc-500">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "offline" | "away";
}

export function PremiumAvatar({ 
  src, 
  name, 
  size = "md",
  className,
  status
}: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-lg",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className={cn("relative inline-block", className)}>
      <motion.div
        className={cn(
          "rounded-full flex items-center justify-center font-semibold",
          "bg-gradient-to-br from-emerald-500/20 to-blue-500/20",
          "border-2 border-white/10",
          sizes[size]
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {initials}
          </span>
        )}
      </motion.div>
      
      {status && (
        <span className={cn(
          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900",
          status === "online" && "bg-emerald-500",
          status === "offline" && "bg-zinc-500",
          status === "away" && "bg-amber-500"
        )} />
      )}
    </div>
  );
}
