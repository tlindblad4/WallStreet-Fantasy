"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Trophy, Bell, CheckCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "trade" | "achievement" | "rank" | "price_alert";
  title: string;
  message: string;
  timestamp: Date;
}

export function usePushNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, "id" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, showNotification, removeNotification };
}

interface PushNotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function PushNotificationContainer({
  notifications,
  onRemove,
}: PushNotificationContainerProps) {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "trade":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case "rank":
        return <Bell className="w-5 h-5 text-blue-400" />;
      case "price_alert":
        return <CheckCircle className="w-5 h-5 text-purple-400" />;
    }
  };

  const getColors = (type: Notification["type"]) => {
    switch (type) {
      case "trade":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "achievement":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "rank":
        return "bg-blue-500/10 border-blue-500/30";
      case "price_alert":
        return "bg-purple-500/10 border-purple-500/30";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`${getColors(notification.type)} border rounded-xl p-4 shadow-lg backdrop-blur-xl`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-lg">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-xs text-zinc-400 mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => onRemove(notification.id)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
