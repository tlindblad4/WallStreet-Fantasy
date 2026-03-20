"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Target, TrendingDown, X, Clock } from "lucide-react";

interface PendingOrder {
  id: string;
  symbol: string;
  order_type: 'limit_buy' | 'limit_sell' | 'stop_loss';
  quantity: number;
  target_price: number;
  status: string;
  created_at: string;
  expires_at: string;
}

interface PendingOrdersListProps {
  leagueMemberId: string;
}

export default function PendingOrdersList({ leagueMemberId }: PendingOrdersListProps) {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from("pending_orders")
        .select("*")
        .eq("league_member_id", leagueMemberId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to changes
    const supabase = createClient();
    const channel = supabase
      .channel('pending_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pending_orders' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueMemberId]);

  const cancelOrder = async (orderId: string) => {
    const supabase = createClient();
    await supabase
      .from("pending_orders")
      .update({ status: 'cancelled' })
      .eq("id", orderId);

    setOrders(orders.filter(o => o.id !== orderId));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'limit_buy':
      case 'limit_sell':
        return <Target className="w-4 h-4 text-blue-400" />;
      case 'stop_loss':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'limit_buy':
        return 'Limit Buy';
      case 'limit_sell':
        return 'Limit Sell';
      case 'stop_loss':
        return 'Stop Loss';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Pending Orders ({orders.length})</h3>
      </div>

      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getIcon(order.order_type)}
              <div>
                <p className="font-medium text-sm">
                  {getLabel(order.order_type)} {order.symbol}
                </p>
                <p className="text-xs text-zinc-500">
                  {order.quantity} shares @ ${order.target_price.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => cancelOrder(order.id)}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Cancel order"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
