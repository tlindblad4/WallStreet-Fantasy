"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, HelpCircle } from "lucide-react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ children, content, position = "top" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${positions[position]} z-50 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white whitespace-nowrap shadow-xl`}
          >
            {content}
            <div className={`absolute w-2 h-2 bg-zinc-800 border-zinc-700 transform rotate-45 ${
              position === "top" ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-b border-r" :
              position === "bottom" ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-t border-l" :
              position === "left" ? "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t border-r" :
              "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b border-l"
            }`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface OnboardingTipProps {
  id: string;
  title: string;
  description: string;
  onDismiss: () => void;
}

export function OnboardingTip({ id, title, description, onDismiss }: OnboardingTipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this tip
    const dismissed = localStorage.getItem(`tip-dismissed-${id}`);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, [id]);

  const handleDismiss = () => {
    localStorage.setItem(`tip-dismissed-${id}`, 'true');
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <HelpCircle className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-400 mb-1">{title}</h4>
          <p className="text-sm text-zinc-300">{description}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </motion.div>
  );
}

export function NewUserBadge() {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
      New
    </span>
  );
}
