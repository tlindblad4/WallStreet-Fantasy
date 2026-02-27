"use client";

import { useState } from "react";
import { Copy, Check, Share2, Mail, MessageCircle } from "lucide-react";

interface InviteShareProps {
  inviteCode: string;
  leagueName: string;
}

export default function InviteShare({ inviteCode, leagueName }: InviteShareProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/leagues/join?code=${inviteCode}`
    : "";

  const shareMessage = `Join my league "${leagueName}" on WallStreet Fantasy! Use invite code: ${inviteCode} or visit: ${shareUrl}`;

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my WallStreet Fantasy league: ${leagueName}`);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareMessage);
    window.open(`sms:?body=${body}`);
  };

  return (
    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold">Invite Friends</h3>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Share this code with friends to invite them to your league
      </p>

      {/* Invite Code Display */}
      <div className="bg-slate-950 rounded-xl p-4 mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Invite Code</p>
        <div className="flex items-center gap-3">
          <code className="text-3xl font-mono font-bold text-green-400 tracking-wider">
            {inviteCode}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Options */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowShareOptions(!showShareOptions)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-black font-semibold transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Share Options Panel */}
      {showShareOptions && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={shareViaEmail}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
          <button
            onClick={shareViaSMS}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Text
          </button>
        </div>
      )}

      {/* Join Link */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 mb-2">Or share this link:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-slate-400 truncate"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
