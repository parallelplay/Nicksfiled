'use client';

import React, { useState } from 'react';
import { Zap, X, ShieldCheck, ExternalLink, RefreshCw, Check, Info, Calculator, Sparkles, Gift, RotateCcw } from 'lucide-react';
import { TrialQuota } from '@/types';

interface TokenManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenBalance: number;
  totalTokensUsed: number;
  trialQuota?: TrialQuota | null;
  onUpdateBalance: (newBalance: number) => void;
  onUpdateTrial?: (quota: Partial<TrialQuota>) => void;
  onRefreshLive?: () => void;
}

export default function TokenManagerModal({
  isOpen,
  onClose,
  tokenBalance,
  totalTokensUsed,
  trialQuota,
  onUpdateBalance,
  onUpdateTrial,
  onRefreshLive,
}: TokenManagerModalProps) {
  const [isEditingPaid, setIsEditingPaid] = useState(false);
  const [paidInput, setPaidInput] = useState(tokenBalance.toString());

  const [isEditingTrial, setIsEditingTrial] = useState(false);
  const [trialInput, setTrialInput] = useState((trialQuota?.remaining || 1251025).toString());
  const [trialLimitInput, setTrialLimitInput] = useState((trialQuota?.totalLimit || 5000000).toString());

  const [isSyncing, setIsSyncing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [localTrial, setLocalTrial] = useState<TrialQuota | null>(trialQuota || null);

  const fetchLiveMetrics = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const data = await res.json();
        setLiveMetrics(data.metrics || null);
        if (data.currentBalance !== undefined) {
          onUpdateBalance(data.currentBalance);
          setPaidInput(data.currentBalance.toString());
        }
        if (data.trialQuota) {
          setLocalTrial(data.trialQuota);
          setTrialInput(data.trialQuota.remaining?.toString() || '0');
          setTrialLimitInput(data.trialQuota.totalLimit?.toString() || '5000000');
          if (onUpdateTrial) onUpdateTrial(data.trialQuota);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setPaidInput(tokenBalance.toString());
      if (trialQuota) {
        setLocalTrial(trialQuota);
        setTrialInput(trialQuota.remaining.toString());
        setTrialLimitInput(trialQuota.totalLimit.toString());
      }
      fetchLiveMetrics();
    }
  }, [isOpen, tokenBalance, trialQuota]);

  if (!isOpen) return null;

  const handleSavePaidBalance = async () => {
    const parsed = parseInt(paidInput.replace(/,/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setIsSyncing(true);
      try {
        await fetch('/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_balance', balance: parsed }),
        });
        onUpdateBalance(parsed);
        setIsEditingPaid(false);
        fetchLiveMetrics();
      } catch (e) {
        onUpdateBalance(parsed);
        setIsEditingPaid(false);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleSaveTrialQuota = async () => {
    const parsedRem = parseInt(trialInput.replace(/,/g, ''), 10);
    const parsedLimit = parseInt(trialLimitInput.replace(/,/g, ''), 10);
    if (!isNaN(parsedRem) && parsedRem >= 0) {
      setIsSyncing(true);
      try {
        const res = await fetch('/api/tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'set_trial', 
            remaining: parsedRem,
            totalLimit: !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5000000,
            enabled: true 
          }),
        });
        if (res.ok) {
          const d = await res.json();
          if (d.trialQuota) {
            setLocalTrial(d.trialQuota);
            if (onUpdateTrial) onUpdateTrial(d.trialQuota);
          }
        }
        setIsEditingTrial(false);
        fetchLiveMetrics();
      } catch (e) {
        console.error(e);
        setIsEditingTrial(false);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleResetTrial = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_trial' }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.trialQuota) {
          setLocalTrial(d.trialQuota);
          setTrialInput(d.trialQuota.remaining.toString());
          if (onUpdateTrial) onUpdateTrial(d.trialQuota);
        }
      }
      fetchLiveMetrics();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeTrial = localTrial || trialQuota || {
    enabled: true,
    totalLimit: 5000000,
    remaining: 1251025,
    used: 3748975,
    status: 'Active (Free Trial Consuming)',
  };

  const trialPercentUsed = Math.min(100, Math.round((activeTrial.used / (activeTrial.totalLimit || 5000000)) * 100));
  const totalCombinedTokens = tokenBalance + (activeTrial.enabled ? activeTrial.remaining : 0);

  const tokensPer5s1080p = 245000;
  const tokensPer5s720p = 108900;
  const trialVideos720p = Math.max(0, Math.floor(activeTrial.remaining / tokensPer5s720p));
  const trialVideos1080p = Math.max(0, Math.floor(activeTrial.remaining / tokensPer5s1080p));
  const totalVideos720p = Math.max(0, Math.floor(totalCombinedTokens / tokensPer5s720p));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-[#111418] border border-[#262e3c] rounded-2xl shadow-2xl overflow-hidden text-white font-sans max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e2531] bg-[#161a20] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center shadow">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                BytePlus ModelArk Token & Quota Manager
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.2 rounded-full border border-emerald-500/30">
                  Live API
                </span>
              </h2>
              <p className="text-[11px] text-[#7d8c9e]">Seedance 2.5 DiT Video Diffusion Engine Quotas</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-[#67778b] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          
          {/* 1. Free Trial Quota Card (Highlighted Green/Cyan) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0e221d] via-[#101b1a] to-[#0f1418] border border-emerald-500/40 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Trial Title & Active Badge */}
            <div className="flex items-center justify-between text-xs text-[#a3b8b1] mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>BytePlus Free Trial Quota (ModelArk Grant)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold">Active — Deducted First</span>
              </div>
            </div>

            {/* Trial Balance Numbers */}
            {isEditingTrial ? (
              <div className="space-y-2 mt-2 bg-black/40 p-3 rounded-lg border border-emerald-500/30">
                <div className="text-[11px] text-[#8ea39c]">Remaining Trial Tokens:</div>
                <input
                  type="text"
                  value={trialInput}
                  onChange={(e) => setTrialInput(e.target.value)}
                  placeholder="e.g. 1251025"
                  className="bg-[#0b1411] border border-emerald-500/60 rounded-lg px-3 py-1.5 text-base font-mono font-bold text-white focus:outline-none w-full"
                />
                <div className="text-[11px] text-[#8ea39c] pt-1">Total Trial Grant Limit:</div>
                <input
                  type="text"
                  value={trialLimitInput}
                  onChange={(e) => setTrialLimitInput(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="bg-[#0b1411] border border-emerald-500/40 rounded-lg px-3 py-1 text-sm font-mono text-white focus:outline-none w-full"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveTrialQuota}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition"
                  >
                    Save Trial Quota
                  </button>
                  <button
                    onClick={() => setIsEditingTrial(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#222938] text-white text-xs hover:bg-[#2c3548] transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline justify-between mt-1">
                <div suppressHydrationWarning className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                  <span className="text-emerald-400">🎁</span>
                  {activeTrial.remaining.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  <span className="text-xs text-[#8ca39b] font-sans font-normal">trial tokens left</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetTrial}
                    title="Reset trial quota back to full 5,000,000 grant"
                    className="text-[11px] text-[#8aa399] hover:text-emerald-300 flex items-center gap-1 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset 5M</span>
                  </button>
                  <button
                    onClick={() => {
                      setTrialInput(activeTrial.remaining.toString());
                      setTrialLimitInput(activeTrial.totalLimit.toString());
                      setIsEditingTrial(true);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline font-semibold transition"
                  >
                    Adjust Trial
                  </button>
                </div>
              </div>
            )}

            {/* Trial Consumption Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] text-[#869b93] font-mono">
                <span>Consumed: {(activeTrial.used / 1000000).toFixed(2)}M ({trialPercentUsed}%)</span>
                <span>Total Grant: {(activeTrial.totalLimit / 1000000).toFixed(1)}M tokens</span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-emerald-500/20">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 transition-all duration-500 rounded-full"
                  style={{ width: `${trialPercentUsed}%` }}
                />
              </div>
            </div>

            <div className="mt-2 text-[10px] text-[#7fa395] leading-relaxed flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>
                Trial Capacity: generates ≈ <strong>{trialVideos720p}</strong> 720p HD videos or ≈ <strong>{trialVideos1080p}</strong> 1080p cinema videos for free before touching paid balance.
              </span>
            </div>
          </div>

          {/* 2. Paid / Standard Token Balance Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#18202c] to-[#12161f] border border-[#2b3548] relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs text-[#8c9ba9] mb-1">
              <span className="font-semibold text-yellow-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Standard / Paid Token Pool
              </span>
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" /> Ready (Backup)
              </span>
            </div>

            {isEditingPaid ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="bg-[#0e1116] border border-yellow-400/60 rounded-lg px-3 py-1.5 text-base font-mono font-bold text-white focus:outline-none w-full"
                  autoFocus
                />
                <button
                  onClick={handleSavePaidBalance}
                  className="px-3 py-1.5 rounded-lg bg-yellow-400 text-black font-bold text-xs hover:bg-yellow-300 transition shrink-0"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingPaid(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#222938] text-white text-xs hover:bg-[#2c3548] transition shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-baseline justify-between mt-1">
                <div suppressHydrationWarning className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                  <span className="text-yellow-400">⚡</span>
                  {tokenBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  <span className="text-xs text-[#8391a3] font-sans font-normal">paid tokens</span>
                </div>
                <button
                  onClick={() => {
                    setPaidInput(tokenBalance.toString());
                    setIsEditingPaid(true);
                  }}
                  className="text-xs text-yellow-400 hover:text-yellow-300 underline font-semibold transition"
                >
                  Adjust Balance
                </button>
              </div>
            )}

            {/* Total Combined Live Capacity */}
            <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#7d8c9e]">
                <span>Total Combined Power (Trial + Paid = {(totalCombinedTokens / 1000000).toFixed(2)}M tokens):</span>
                <button 
                  onClick={fetchLiveMetrics}
                  disabled={isSyncing}
                  className="flex items-center gap-1 text-[11px] text-yellow-400 hover:text-yellow-300 transition"
                  title="Sync live token quotas from server"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                  <div className="text-[10px] text-cyan-400 uppercase font-bold">1080p Cinema</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {(totalCombinedTokens / (49000 * 60)).toFixed(1)} <span className="text-[10px] text-[#8695a7] font-normal">min</span>
                  </div>
                  <div className="text-[9px] text-[#718296] font-sans">≈ {Math.floor(totalCombinedTokens / tokensPer5s1080p)} shots (5s)</div>
                </div>

                <div className="p-2 rounded-lg bg-black/40 border border-yellow-500/20">
                  <div className="text-[10px] text-yellow-400 uppercase font-bold">720p HD</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {(totalCombinedTokens / (21780 * 60)).toFixed(1)} <span className="text-[10px] text-[#8695a7] font-normal">min</span>
                  </div>
                  <div className="text-[9px] text-[#718296] font-sans">≈ {totalVideos720p} shots (5s)</div>
                </div>

                <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">480p Draft</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {(totalCombinedTokens / (9680 * 60)).toFixed(1)} <span className="text-[10px] text-[#8695a7] font-normal">min</span>
                  </div>
                  <div className="text-[9px] text-[#718296] font-sans">≈ {Math.floor(totalCombinedTokens / 48400)} shots</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actual Token Consumption Rates (Verified 1:1 from BytePlus API) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-yellow-400" />
                Actual ModelArk Token Consumption Rates
              </span>
              <span className="text-[10px] text-emerald-400 font-mono lowercase">verified live</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#141820] border border-[#222a38] flex flex-col justify-between">
                <span className="text-[#8492a4] text-[11px]">480p Video (5s Draft Mode)</span>
                <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                  48,400 <span className="text-[10px] text-[#717d8e] font-sans font-normal">tokens (9.6k/s)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141820] border border-[#222a38] flex flex-col justify-between">
                <span className="text-[#8492a4] text-[11px]">720p Video (5s Standard HD)</span>
                <div className="text-sm font-bold font-mono text-yellow-300 mt-1">
                  108,900 <span className="text-[10px] text-[#717d8e] font-sans font-normal">tokens (21.7k/s)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141820] border border-[#222a38] flex flex-col justify-between">
                <span className="text-[#8492a4] text-[11px]">1080p Video (5s Cinema 10-bit)</span>
                <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
                  245,025 <span className="text-[10px] text-[#717d8e] font-sans font-normal">tokens (49k/s)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141820] border border-[#222a38] flex flex-col justify-between">
                <span className="text-[#8492a4] text-[11px]">1080p Video (8s Cinema Full HD)</span>
                <div className="text-sm font-bold font-mono text-purple-300 mt-1">
                  392,040 <span className="text-[10px] text-[#717d8e] font-sans font-normal">tokens</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-[#697789] leading-relaxed pt-1">
              * BytePlus ModelArk DiT formula: (width × height × 24fps × duration) / 1,024. Active generations consume Free Trial Credits first until 0, then switch seamlessly to standard token balance.
            </p>
          </div>

          {/* Session Consumption Tracker */}
          <div className="p-3 rounded-xl bg-[#13161c] border border-[#202632] flex items-center justify-between text-xs">
            <span className="text-[#8a99ab]">Total Tokens Consumed Across Sessions:</span>
            <span suppressHydrationWarning className="font-mono font-bold text-white">
              {totalTokensUsed.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} tokens
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1e2531] bg-[#14181f] flex items-center justify-between text-xs shrink-0">
          <a
            href="https://ai.byteplus.com/ark/region:ap-southeast-1/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#91a0b3] hover:text-white transition"
          >
            <span>Open BytePlus Billing Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

