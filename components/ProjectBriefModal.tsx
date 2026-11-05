'use client';

import React, { useState } from 'react';
import { X, FileText, Save, Check } from 'lucide-react';

interface ProjectBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  initialBrief: string;
  onSaveBrief: (newBrief: string) => void;
}

export default function ProjectBriefModal({
  isOpen,
  onClose,
  projectTitle,
  initialBrief,
  onSaveBrief,
}: ProjectBriefModalProps) {
  const [briefText, setBriefText] = useState(initialBrief);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveBrief(briefText);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#111418] border border-[#242b37] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2530] bg-[#14181f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Project Brief — {projectTitle}</h2>
              <p className="text-xs text-[#7e8999]">Global aesthetic rules, color palettes, and cinematic continuity notes.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6c7786] hover:text-white p-1 rounded-lg hover:bg-[#202632] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="p-6 flex-1 overflow-y-auto">
          <textarea
            rows={14}
            value={briefText}
            onChange={(e) => setBriefText(e.target.value)}
            className="w-full bg-[#161a22] border border-[#2b3341] rounded-xl p-4 text-xs text-[#d1d8e2] font-mono leading-relaxed focus:outline-none focus:border-yellow-400/70 resize-none selection:bg-yellow-400/20"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1c212a] bg-[#0e1115]">
          <span className="text-xs text-[#6e7a8a]">Auto-synced with Cinema Studio AI Director</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#202632] text-xs font-medium text-[#939eaf] hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black text-xs font-bold shadow-md transition"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved!' : 'Save Brief'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
