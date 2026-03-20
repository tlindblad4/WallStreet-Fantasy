"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = "",
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.y > threshold && onSwipeDown) {
      onSwipeDown();
    } else if (info.offset.y < -threshold && onSwipeUp) {
      onSwipeUp();
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        handleDragEnd(e, info);
      }}
      style={{ x, y }}
      whileDrag={{ scale: 1.02, cursor: "grabbing" }}
      className={`${className} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
    >
      {children}
    </motion.div>
  );
}

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (container.scrollTop === 0 && startY.current > 0) {
        const distance = e.touches[0].clientY - startY.current;
        if (distance > 0) {
          setPullDistance(Math.min(distance * 0.5, 100));
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > 80) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      startY.current = 0;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, onRefresh]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull indicator */}
      <motion.div
        style={{ height: pullDistance }}
        className="flex items-center justify-center overflow-hidden"
      >
        {isRefreshing ? (
          <motion.div
            className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <motion.div
            animate={{ rotate: pullDistance > 80 ? 180 : 0 }}
            className="text-emerald-400"
          >
            ↓
          </motion.div>
        )}
      </motion.div>
      {children}
    </div>
  );
}

export function DoubleTapButton({
  children,
  onDoubleTap,
  className = "",
}: {
  children: ReactNode;
  onDoubleTap: () => void;
  className?: string;
}) {
  const [lastTap, setLastTap] = useState(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <motion.button
      onClick={handleTap}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}
