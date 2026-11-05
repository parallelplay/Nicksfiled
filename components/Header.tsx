'use client';

import React from 'react';
import { Film, Sparkles, Crown, Zap, Gift } from 'lucide-react';
import { TrialQuota } from '@/types';

interface HeaderProps {
  tokenBalance?: number;
  trialQuota?: TrialQuota | null;
  onOpenTokenManager?: () => void;
}

export default function Header({ 
  tokenBalance = 5000000, 
  trialQuota,
  onOpenTokenManager 
}: HeaderProps) {
  const formatTokens = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    return `${(val / 1000).toFixed(0)}k`;
  };

  return (
    <header className="h-[46px] bg-[#0d0f12] border-b border-[#1f242c] flex items-center justify-between px-4 text-xs select-none sticky top-0 z-50">
      {/* Left Logo & Cinema Studio Brand */}
      <div className="flex items-center gap-3">
        {/* Nickfield Logo */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 to-lime-300 flex items-center justify-center text-black font-black text-xs">
            N
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-sans">Nickfield</span>
        </div>

        <div className="h-3.5 w-[1px] bg-[#22272f]" />

        {/* Dedicated Cinema Studio Badge */}
        <div className="px-2.5 py-1 rounded-md bg-[#1f252f] text-white font-semibold flex items-center gap-1.5 border border-[#2b3341] shadow-sm">
          <Film className="w-3.5 h-3.5 text-yellow-400" />
          <span>Cinema Studio</span>
        </div>
      </div>

      {/* Right Actions & Token Pills */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Free Trial Credit Pill (Side me trail tokens) */}
        {trialQuota && (
          <button 
            onClick={onOpenTokenManager}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition shadow-sm group ${
              trialQuota.enabled && trialQuota.remaining > 0
                ? 'bg-[#0e201b] hover:bg-[#152e27] border-emerald-500/40 text-emerald-300'
                : 'bg-[#181a1f] hover:bg-[#20232a] border-[#2c323d] text-[#788597]'
            }`}
            title={`BytePlus ModelArk Free Trial: ${(trialQuota.remaining / 1000).toFixed(0)}k remaining out of ${(trialQuota.totalLimit / 1000000).toFixed(1)}M grant. Free trial credits are used first!`}
          >
            {trialQuota.enabled && trialQuota.remaining > 0 ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-gray-500"></span>
            )}
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span suppressHydrationWarning className="font-bold text-emerald-200">
              {formatTokens(trialQuota.remaining)}
            </span>
            <span className="text-[9px] bg-emerald-500/15 text-emerald-300 font-sans px-1.5 py-0.2 rounded border border-emerald-500/30 font-medium">
              {trialQuota.enabled && trialQuota.remaining > 0 ? 'Trial Active' : 'Trial Empty'}
            </span>
          </button>
        )}

        {/* Live BytePlus Standard / Paid Token Balance Pill */}
        <button 
          onClick={onOpenTokenManager}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#171c24] hover:bg-[#202734] border border-yellow-400/40 text-yellow-300 font-mono text-xs transition shadow-sm group"
          title="BytePlus ModelArk Paid / Account Token Balance - Click to manage"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400 fill-current" />
          <span suppressHydrationWarning className="font-bold text-white">{formatTokens(tokenBalance)}</span>
          <span className="text-[10px] text-[#8695a7] font-sans">tokens</span>
          <span className="text-[9px] bg-yellow-400/10 text-yellow-400 font-sans px-1.5 py-0.2 rounded border border-yellow-400/20 ml-0.5">
            108.9k/vid
          </span>
        </button>

        <button className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 hover:brightness-110 transition">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Upgrade</span>
        </button>

        <button className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[#9aa2ad] hover:text-white rounded hover:bg-[#1a1e24] transition">
          <Crown className="w-3.5 h-3.5 text-yellow-400/80" />
          <span>Enterprise</span>
        </button>

        {/* Profile Badge */}
        <div 
          onClick={onOpenTokenManager}
          className="flex items-center gap-1.5 pl-2 border-l border-[#22272f] cursor-pointer group"
          title="Account profile & tokens"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-[10px] font-bold text-white border border-emerald-400/30 group-hover:scale-105 transition">
            D
          </div>
          <span className="text-xs text-[#cbd2dc] font-medium hidden sm:inline group-hover:text-white">Digital</span>
        </div>
      </div>
    </header>
  );
}
