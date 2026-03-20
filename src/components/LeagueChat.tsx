"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { Send, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
}

interface LeagueChatProps {
  leagueId: string;
  currentUserId: string;
}

export default function LeagueChat({ leagueId, currentUserId }: LeagueChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const supabase = createClient();
      
      const { data } = await supabase
        .from("league_chat_messages")
        .select(`
          id,
          user_id,
          message,
          created_at,
          profiles:user_id(username)
        `)
        .eq("league_id", leagueId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data) {
        setMessages(data.map((m: any) => ({
          ...m,
          username: m.profiles?.username || "Unknown",
        })));
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const supabase = createClient();
    const channel = supabase
      .channel('league_chat')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'league_chat_messages',
          filter: `league_id=eq.${leagueId}`
        },
        async (payload) => {
          // Fetch username for new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: ChatMessage = {
            id: payload.new.id,
            user_id: payload.new.user_id,
            username: profile?.username || "Unknown",
            message: payload.new.message,
            created_at: payload.new.created_at,
          };

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const supabase = createClient();
    await supabase
      .from("league_chat_messages")
      .insert({
        league_id: leagueId,
        user_id: currentUserId,
        message: newMessage.trim(),
      });

    setNewMessage("");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 h-96">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-20" />
                <div className="h-8 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800">
        <MessageCircle className="w-5 h-5 text-emerald-400" />
        <h3 className="font-semibold">League Chat</h3>
        <span className="text-xs text-zinc-500 ml-auto">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.user_id === currentUserId ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-emerald-400">
                  {msg.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`max-w-[70%] ${
                msg.user_id === currentUserId ? 'text-right' : ''
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-zinc-500">
                    {msg.username}
                  </span>
                  <span className="text-xs text-zinc-600">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <div className={`inline-block px-3 py-2 rounded-xl text-sm ${
                  msg.user_id === currentUserId
                    ? 'bg-emerald-500/20 text-emerald-100'
                    : 'bg-zinc-800 text-zinc-200'
                }`}>
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
