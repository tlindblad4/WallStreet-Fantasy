"use client";

import { useState } from "react";
import { Share2, Twitter, Linkedin, Link2, Check, X } from "lucide-react";

interface SharePortfolioProps {
  leagueName: string;
  totalReturn: number;
  returnPercent: number;
  rank: number;
}

export default function SharePortfolio({ 
  leagueName, 
  totalReturn, 
  returnPercent, 
  rank 
}: SharePortfolioProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPositive = totalReturn >= 0;
  const emoji = isPositive ? "🚀" : "📉";
  const rankEmoji = rank === 1 ? "🏆" : rank <= 3 ? "🥉" : "📊";

  const shareText = `${emoji} I'm ${isPositive ? 'up' : 'down'} ${Math.abs(returnPercent).toFixed(1)}% (${isPositive ? '+' : ''}$${Math.abs(totalReturn).toLocaleString()}) in ${leagueName} on WallStreet Fantasy! ${rankEmoji} Currently ranked #${rank}. Think you can beat me? #WallStreetFantasy #StockTrading`;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowModal(false);
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowModal(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share Performance
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Share Your Performance</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{shareText}</p>
            </div>

            {/* Share Options */}
            <div className="space-y-3">
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#1DA1F2]/10 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-xl hover:bg-[#1DA1F2]/20 transition-colors"
              >
                <Twitter className="w-5 h-5" />
                Share on Twitter
              </button>

              <button
                onClick={shareToLinkedIn}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] rounded-xl hover:bg-[#0A66C2]/20 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
                Share on LinkedIn
              </button>

              <button
                onClick={copyToClipboard}
                className="w-full flex items-center justify-center gap-2 p-3 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Link2 className="w-5 h-5" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
