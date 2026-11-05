'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Download, Sparkles, Clock, AtSign, Film, Zap, Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Loader2 } from 'lucide-react';
import { GeneratedAsset } from '@/types';

interface VideoPlayerModalProps {
  asset: GeneratedAsset | null;
  onClose: () => void;
}

export default function VideoPlayerModal({ asset, onClose }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);

  useEffect(() => {
    if (!asset || !videoRef.current) return;
    const video = videoRef.current;
    setIsBuffering(true);

    const onReadyToPlay = () => {
      setIsBuffering(false);
      video.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          // Fallback to muted if browser blocks unmuted audio
          video.muted = true;
          setIsMuted(true);
          video.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        });
    };

    if (video.readyState >= 3) {
      onReadyToPlay();
    } else {
      video.addEventListener('canplay', onReadyToPlay, { once: true });
    }

    return () => {
      video.removeEventListener('canplay', onReadyToPlay);
    };
  }, [asset]);

  if (!asset) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play error:', e));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleResync = () => {
    if (!videoRef.current) return;
    setIsBuffering(true);
    const video = videoRef.current;
    const curTime = video.currentTime;
    video.pause();
    video.load();
    video.currentTime = curTime;
    video.play()
      .then(() => {
        setIsPlaying(true);
        setIsBuffering(false);
      })
      .catch(() => {
        setIsBuffering(false);
      });
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#111418] border border-[#262e3d] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh]">
        {/* Left Video Player Container */}
        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[340px] md:min-h-[500px] group overflow-hidden">
          <video
            ref={videoRef}
            src={asset.videoUrl}
            poster={asset.thumbnail}
            controls
            playsInline
            preload="auto"
            loop
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
            onCanPlay={() => setIsBuffering(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="max-h-[560px] w-auto max-w-full object-contain rounded-lg shadow-2xl cursor-pointer"
            onClick={togglePlay}
          />

          {/* Buffering Spinner Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none z-30">
              <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-2" />
              <span className="text-xs text-white font-medium">Buffering 1080p Video Stream...</span>
            </div>
          )}

          {/* Center Play Overlay Button if paused and not buffering */}
          {!isPlaying && !isBuffering && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all z-20"
            >
              <div className="w-16 h-16 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center shadow-2xl transform scale-100 hover:scale-105 transition-all">
                <Play className="w-7 h-7 fill-black ml-1" />
              </div>
            </div>
          )}

          {/* Quick Sound Toggle Pill (if browser forced muted autoplay) */}
          {isMuted && isPlaying && (
            <button
              onClick={toggleMute}
              className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-yellow-300 text-xs font-semibold backdrop-blur-md border border-yellow-400/30 flex items-center gap-1.5 shadow-lg transition"
            >
              <VolumeX className="w-4 h-4 text-yellow-400" />
              <span>Tap to Unmute Sound</span>
            </button>
          )}

          {/* Bottom Custom Overlay Controls (Visible on Hover) */}
          <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition shadow"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition shadow"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
              </button>
              <button
                onClick={handleResync}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-yellow-300 border border-yellow-400/20 backdrop-blur-md transition shadow flex items-center gap-1 text-[11px]"
                title="Reload/Resync Video Stream"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Resync</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={handleFullscreen}
                className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition shadow"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-full md:w-80 bg-[#141820] border-t md:border-t-0 md:border-l border-[#222834] flex flex-col justify-between p-5 text-xs">
          <div className="space-y-4 overflow-y-auto pr-1 no-scrollbar">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                {asset.model} • {asset.resolution}
              </span>
              <button onClick={onClose} className="text-[#6c7786] hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Tokens */}
            <div>
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="text-sm font-bold text-white truncate">{asset.title}</h3>
                <span className="text-[10px] font-mono text-yellow-300 font-bold bg-[#1d232e] border border-yellow-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                  {asset.tokensUsed ? asset.tokensUsed.toLocaleString() : '108,900'} tokens
                </span>
              </div>
              <p className="text-[11px] text-[#717d8e] mt-1">{asset.createdAt} • {asset.duration} • {asset.aspectRatio}</p>
            </div>

            {/* Elements Used */}
            {asset.elementsUsed && asset.elementsUsed.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-[#717d8e] uppercase tracking-wider block mb-1.5">
                  Locked References
                </span>
                <div className="flex flex-wrap gap-1">
                  {asset.elementsUsed.map((tag, i) => (
                    <span key={i} className="text-[11px] font-mono font-bold bg-[#1e2532] text-yellow-300 px-2 py-0.5 rounded border border-[#2b3547]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Full Prompt */}
            <div>
              <span className="text-[10px] font-bold text-[#717d8e] uppercase tracking-wider block mb-1">
                Generation Prompt
              </span>
              <div className="p-3 bg-[#0d1015] border border-[#1f2530] rounded-xl text-[#cbd3de] text-[11px] leading-relaxed max-h-48 overflow-y-auto no-scrollbar font-sans selection:bg-yellow-400/30">
                {asset.prompt}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#1f2532] space-y-2">
            <a
              href={asset.videoUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black font-bold text-xs transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4 Video</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
