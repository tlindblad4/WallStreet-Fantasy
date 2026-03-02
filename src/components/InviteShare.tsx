"use client";

import { useState } from "react";
import { Copy, Check, Share2, Mail, MessageCircle, Send, X, Plus, Loader2 } from "lucide-react";

interface InviteShareProps {
  inviteCode: string;
  leagueName: string;
  leagueId: string;
}

export default function InviteShare({ inviteCode, leagueName, leagueId }: InviteShareProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emails, setEmails] = useState<string[]>([""]);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

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

  const shareViaEmailClient = () => {
    const subject = encodeURIComponent(`Join my WallStreet Fantasy league: ${leagueName}`);
    const body = encodeURIComponent(shareMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(shareMessage);
    window.open(`sms:?body=${body}`);
  };

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const sendEmailInvites = async () => {
    const validEmails = emails.filter((e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    
    if (validEmails.length === 0) {
      setSendResult({ success: false, message: "Please enter at least one valid email address" });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/invites/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leagueId,
          emails: validEmails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendResult({
          success: true,
          message: `Invites sent to ${data.sent} friend${data.sent !== 1 ? "s" : ""}!`,
        });
        setEmails([""]); // Reset form
        setTimeout(() => setShowEmailForm(false), 2000);
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to send invites",
        });
      }
    } catch (error) {
      setSendResult({
        success: false,
        message: "Network error. Please try again.",
      });
    }

    setSending(false);
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => {
            setShowEmailForm(!showEmailForm);
            setShowShareOptions(false);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
            showEmailForm
              ? "bg-blue-500 text-white"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          }`}
        >
          <Mail className="w-4 h-4" />
          Email Invite
        </button>
        <button
          onClick={() => {
            setShowShareOptions(!showShareOptions);
            setShowEmailForm(false);
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          More Options
        </button>
      </div>

      {/* Email Invite Form */}
      {showEmailForm && (
        <div className="bg-slate-950/50 rounded-xl p-4 mb-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Send Email Invites</h4>
            <button
              onClick={() => setShowEmailForm(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-4">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {emails.length > 1 && (
                  <button
                    onClick={() => removeEmailField(index)}
                    className="px-2 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addEmailField}
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mb-4"
          >
            <Plus className="w-4 h-4" />
            Add another email
          </button>

          {sendResult && (
            <div
              className={`p-3 rounded-lg text-sm mb-4 ${
                sendResult.success
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {sendResult.message}
            </div>
          )}

          <button
            onClick={sendEmailInvites}
            disabled={sending || emails.every((e) => !e.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send {emails.filter((e) => e.trim()).length > 0 && `(${emails.filter((e) => e.trim()).length})`} Invite{emails.filter((e) => e.trim()).length !== 1 ? "s" : ""}
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 mt-3 text-center">
            Your friends will receive an email with your invite code and a link to join
          </p>
        </div>
      )}

      {/* Share Options Panel */}
      {showShareOptions && (
        <div className="bg-slate-950/50 rounded-xl p-4 mb-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">Share Via</h4>
            <button
              onClick={() => setShowShareOptions(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={shareViaEmailClient}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email App
            </button>
            <button
              onClick={shareViaSMS}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Text Message
            </button>
          </div>
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
