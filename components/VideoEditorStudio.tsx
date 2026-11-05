'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Scissors, 
  Sparkles, 
  Camera, 
  Film, 
  AtSign, 
  Clock, 
  ArrowRight, 
  Check, 
  RotateCcw, 
  Save, 
  Layers, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Folder, 
  ChevronDown, 
  X,
  FileVideo,
  CornerDownRight
} from 'lucide-react';
import { Project, GeneratedAsset, ElementReference } from '@/types';

interface VideoEditorStudioProps {
  currentProject: Project;
  allAssets: GeneratedAsset[];
  initialAsset?: GeneratedAsset | null;
  onSaveEditedAsset: (updatedAsset: GeneratedAsset) => void;
  onGenerateRevised: (prompt: string, selectedElements: ElementReference[], settings: any, originalAssetId: string) => void;
  isGenerating?: boolean;
  onClose?: () => void;
}

export default function VideoEditorStudio({
  currentProject,
  allAssets = [],
  initialAsset = null,
  onSaveEditedAsset,
  onGenerateRevised,
  isGenerating = false,
  onClose,
}: VideoEditorStudioProps) {
  // Candidate assets for editing (current project's assets first, or all assets)
  const projectAssets = currentProject.assets.length > 0 ? currentProject.assets : allAssets;
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(
    initialAsset || projectAssets[0] || null
  );

  // Edit Mode Tabs
  const [editMode, setEditMode] = useState<'prompt' | 'elements' | 'camera_look' | 'extend'>('prompt');

  // Video Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Editable Form fields
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedPrompt, setRevisedPrompt] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisedCamera, setRevisedCamera] = useState('Auto Camera');
  const [revisedLook, setRevisedLook] = useState('Default Neutral');
  const [revisedFolderId, setRevisedFolderId] = useState('renders');
  const [extendSeconds, setExtendSeconds] = useState(5);
  const [activeElements, setActiveElements] = useState<ElementReference[]>([]);
  const [motionIntensity, setMotionIntensity] = useState(7);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize when selectedAsset changes
  useEffect(() => {
    if (selectedAsset) {
      setRevisedTitle(selectedAsset.title.includes('(v') ? selectedAsset.title : `${selectedAsset.title} (v2 - Edited)`);
      setRevisedPrompt(selectedAsset.prompt || '');
      setRevisedCamera(selectedAsset.cameraMovement || 'Auto Camera');
      setRevisedLook(selectedAsset.opticalLook || 'Default Neutral');
      setRevisedFolderId(selectedAsset.folderId || 'renders');
      setRevisionNotes(selectedAsset.editNotes || 'Adjusted scene details, lighting temperature and camera cadence.');
      setMotionIntensity(selectedAsset.motionStrength || 7);

      // Match elements from current project
      const matched = currentProject.elements.filter(e => 
        (selectedAsset.elementsUsed || []).some(tag => tag === e.tag || tag.includes(e.name))
      );
      setActiveElements(matched);
    }
  }, [selectedAsset, currentProject]);

  // Video Time Update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoDuration && videoRef.current.duration) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toggle reference element in editor
  const handleToggleElement = (element: ElementReference) => {
    const exists = activeElements.some(e => e.id === element.id);
    if (exists) {
      setActiveElements(prev => prev.filter(e => e.id !== element.id));
      // Remove tag from revisedPrompt
      setRevisedPrompt(prev => prev.replace(new RegExp(`\\s*${element.tag}`, 'g'), '').trim());
    } else {
      setActiveElements(prev => [...prev, element]);
      // Add tag to revisedPrompt
      setRevisedPrompt(prev => `${prev ? prev.trim() + ' ' : ''}${element.tag}`);
    }
  };

  // Save metadata modifications directly without re-rendering GPU
  const handleSaveMetadataOnly = () => {
    if (!selectedAsset) return;
    const updated: GeneratedAsset = {
      ...selectedAsset,
      title: revisedTitle.trim(),
      prompt: revisedPrompt.trim(),
      cameraMovement: revisedCamera !== 'Auto Camera' ? revisedCamera : undefined,
      opticalLook: revisedLook !== 'Default Neutral' ? revisedLook : undefined,
      folderId: revisedFolderId,
      editNotes: revisionNotes.trim(),
      version: 'v2 - Edited',
    };
    onSaveEditedAsset(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  // Dispatch full video inpaint / re-render revision
  const handleDispatchReRender = () => {
    if (!selectedAsset) return;

    let finalPrompt = revisedPrompt.trim();
    if (editMode === 'extend') {
      finalPrompt = `${selectedAsset.prompt} [Sequel Extension: Continue shot seamlessly by +${extendSeconds}s, keeping identical character position and lighting]`;
    } else if (revisionNotes.trim()) {
      finalPrompt = `${finalPrompt} [Revision Directives: ${revisionNotes.trim()}]`;
    }

    onGenerateRevised(
      finalPrompt,
      activeElements,
      {
        model: selectedAsset.model || 'Seedance 2.5',
        aspectRatio: selectedAsset.aspectRatio || '16:9',
        resolution: selectedAsset.resolution || '1080p',
        duration: editMode === 'extend' ? `${extendSeconds}s` : selectedAsset.duration,
        bitrate: 'High',
        sound: true,
        batchCount: 1,
        referenceMode: editMode === 'extend' ? 'Sequel' : 'Edit video',
        referencesCount: activeElements.length,
        cameraMovement: revisedCamera,
        opticalLook: revisedLook,
        motionStrength: motionIntensity,
      },
      selectedAsset.id
    );
  };

  return (
    <div className="w-full max-w-[1020px] mx-auto space-y-5 p-2 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#171b25] via-[#12161f] to-[#19202e] border border-[#273244] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-[0_0_24px_rgba(234,179,8,0.3)]">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide text-white uppercase">
                  Video Editing Studio
                </h1>
                <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-mono font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
                  Non-Destructive Inpainting & Revision
                </span>
              </div>
              <p className="text-xs text-[#8292a8] mt-0.5">
                Reopen and modify previously generated shots in {currentProject.title} without rebuilding from scratch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Switch Video Dropdown */}
            <div className="relative">
              <select
                value={selectedAsset?.id || ''}
                onChange={(e) => {
                  const target = projectAssets.find(a => a.id === e.target.value);
                  if (target) setSelectedAsset(target);
                }}
                className="bg-[#181f2c] border border-[#2d3a4f] text-xs font-semibold text-white rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-400 max-w-[220px] truncate"
              >
                {projectAssets.map((asset, idx) => (
                  <option key={asset.id} value={asset.id}>
                    {idx + 1}. {asset.title} ({asset.resolution})
                  </option>
                ))}
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="text-[#728094] hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
                title="Close Editor"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {!selectedAsset ? (
        <div className="h-64 rounded-2xl bg-[#12161f] border border-[#232a38] flex flex-col items-center justify-center text-center p-6 text-[#67778b]">
          <FileVideo className="w-10 h-10 mb-2 text-[#465366]" />
          <span className="text-sm font-bold text-white">No video selected to edit</span>
          <p className="text-xs text-[#6e7d91] mt-1 max-w-sm">
            Select a generated video from the project list above or click "Edit" on any video card in your canvas.
          </p>
        </div>
      ) : (
        /* Main 2-Column Editor Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Video Viewport & Playback Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#11141c] border border-[#222a38] rounded-2xl overflow-hidden shadow-2xl relative group">
              {/* Video Element */}
              <div className="relative aspect-video bg-black flex items-center justify-center">
                {selectedAsset.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={selectedAsset.videoUrl}
                    poster={selectedAsset.thumbnail}
                    muted={isMuted}
                    playsInline
                    loop
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                    onClick={togglePlay}
                    className="w-full h-full object-contain cursor-pointer"
                  />
                ) : (
                  <img
                    src={selectedAsset.thumbnail}
                    alt={selectedAsset.title}
                    className="w-full h-full object-contain"
                  />
                )}

                {/* Center Play/Pause button on hover */}
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer pointer-events-auto"
                >
                  <div className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-2xl transform scale-95 hover:scale-105 transition">
                    {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                  </div>
                </div>

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-yellow-300 px-2.5 py-0.5 rounded-md border border-white/10">
                    {selectedAsset.model} • {selectedAsset.resolution}
                  </span>
                  <span className="text-[10px] font-mono font-semibold bg-black/80 backdrop-blur-md text-white px-2 py-0.5 rounded-md">
                    {currentTime.toFixed(1)}s / {videoDuration ? videoDuration.toFixed(1) : selectedAsset.duration}
                  </span>
                </div>
              </div>

              {/* Player Scrub & Controls Toolbar */}
              <div className="p-3.5 bg-[#141822] border-t border-[#202736] space-y-2.5">
                {/* Timeline Scrubber */}
                <input
                  type="range"
                  min="0"
                  max={videoDuration || 10}
                  step="0.05"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-[#252f40] rounded-lg appearance-none cursor-pointer accent-yellow-400"
                />

                <div className="flex items-center justify-between text-xs text-[#8c9cae]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-1 hover:text-white transition"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 hover:text-white transition"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    </button>

                    <span className="font-mono text-[11px] text-[#cbd5e1]">
                      {currentTime.toFixed(1)}s
                    </span>
                  </div>

                  {/* Playback speed buttons */}
                  <div className="flex items-center gap-1 bg-[#1a202c] p-0.5 rounded-lg border border-[#273244] text-[10px] font-mono">
                    {[0.5, 1, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => handleChangeSpeed(speed)}
                        className={`px-1.5 py-0.5 rounded ${
                          playbackSpeed === speed
                            ? 'bg-yellow-400 text-black font-bold'
                            : 'text-[#8493a7] hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Original Metadata Box */}
            <div className="bg-[#12161f] border border-[#232b38] rounded-2xl p-4 text-xs space-y-2">
              <span className="text-[10px] font-bold text-[#6a7789] uppercase tracking-wider block">
                Original Shot Metadata
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-[#171c26] p-2 rounded-xl border border-[#252e3d]">
                  <span className="text-[#6d7b8d] block text-[9px] uppercase">Resolution</span>
                  <span className="font-bold text-white font-mono">{selectedAsset.resolution}</span>
                </div>
                <div className="bg-[#171c26] p-2 rounded-xl border border-[#252e3d]">
                  <span className="text-[#6d7b8d] block text-[9px] uppercase">Aspect Ratio</span>
                  <span className="font-bold text-white font-mono">{selectedAsset.aspectRatio}</span>
                </div>
                <div className="bg-[#171c26] p-2 rounded-xl border border-[#252e3d]">
                  <span className="text-[#6d7b8d] block text-[9px] uppercase">Tokens Used</span>
                  <span className="font-bold text-yellow-300 font-mono">{(selectedAsset.tokensUsed || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[#171c26] p-2 rounded-xl border border-[#252e3d]">
                  <span className="text-[#6d7b8d] block text-[9px] uppercase">Folder</span>
                  <span className="font-semibold text-[#cbd5e1] truncate block">{selectedAsset.folderPath || 'Renders & Masters'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Revision Controls Workspace */}
          <div className="lg:col-span-5 space-y-4 bg-[#12161f] border border-[#232b38] rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              {/* Revision Mode Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-[#181d27] rounded-xl border border-[#263041] text-xs font-semibold overflow-x-auto no-scrollbar">
                {[
                  { id: 'prompt', label: 'Revise Prompt' },
                  { id: 'elements', label: 'Adjust Elements' },
                  { id: 'camera_look', label: 'Camera & Look' },
                  { id: 'extend', label: 'Extend (+s)' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setEditMode(tab.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition whitespace-nowrap ${
                      editMode === tab.id
                        ? 'bg-yellow-400 text-black shadow font-bold'
                        : 'text-[#8796a8] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Title & Version */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#8695a8] uppercase">Version Title:</label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  className="w-full bg-[#171c26] border border-[#273244] focus:border-yellow-400 text-xs text-white rounded-xl px-3 py-2 focus:outline-none transition"
                />
              </div>

              {/* TAB 1: PROMPT REVISION */}
              {editMode === 'prompt' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8695a8] uppercase flex items-center justify-between">
                      <span>Revise Scene Prompt:</span>
                      <span className="text-[10px] text-yellow-300 font-mono">Modifies without full rebuild</span>
                    </label>
                    <textarea
                      value={revisedPrompt}
                      onChange={(e) => setRevisedPrompt(e.target.value)}
                      rows={4}
                      className="w-full bg-[#171c26] border border-[#273244] focus:border-yellow-400 text-xs text-white rounded-xl p-3 focus:outline-none resize-none transition leading-relaxed"
                      placeholder="Modify lighting, action, background, or elements in this shot..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8695a8] uppercase">Revision Notes / Directives:</label>
                    <input
                      type="text"
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="e.g. Added rain reflections, slowed camera pace, refined facial detail"
                      className="w-full bg-[#171c26] border border-[#273244] focus:border-yellow-400 text-xs text-white rounded-xl px-3 py-2 focus:outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: ADJUST ELEMENTS (Strictly currentProject.elements) */}
              {editMode === 'elements' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#8695a8] uppercase">
                      Project Locked References ({currentProject.elements.length})
                    </label>
                    <span className="text-[10px] text-yellow-400 font-mono">{activeElements.length} active in shot</span>
                  </div>

                  {currentProject.elements.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#171c26] border border-[#252e3d] text-center text-[#6e7d91] text-xs">
                      No reference elements in {currentProject.title} yet. Add elements in the project elements drawer.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                      {currentProject.elements.map(el => {
                        const isPinned = activeElements.some(e => e.id === el.id);
                        return (
                          <div
                            key={el.id}
                            onClick={() => handleToggleElement(el)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border transition ${
                              isPinned
                                ? 'bg-yellow-400/15 border-yellow-400 text-white font-semibold'
                                : 'bg-[#161b24] border-[#252e3d] text-[#8695a8] hover:border-[#3a475d]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={el.thumbnail} alt={el.name} className="w-8 h-8 rounded-lg object-cover border border-[#2b3648]" />
                              <div>
                                <div className="text-xs text-white flex items-center gap-1.5">
                                  <span>{el.name}</span>
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-[#93a0b5] uppercase">
                                    {el.category}
                                  </span>
                                </div>
                                <div className="text-[10px] text-yellow-400 font-mono">{el.tag}</div>
                              </div>
                            </div>

                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                              isPinned ? 'bg-yellow-400 border-yellow-400 text-black' : 'border-[#38455a]'
                            }`}>
                              {isPinned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CAMERA & LOOK REVISION */}
              {editMode === 'camera_look' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#717f92] uppercase">Camera Movement:</label>
                    <select
                      value={revisedCamera}
                      onChange={(e) => setRevisedCamera(e.target.value)}
                      className="w-full bg-[#171c26] border border-[#293447] text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-yellow-400"
                    >
                      <option value="Auto Camera">Auto / Preserved Camera</option>
                      <option value="Static Tripod">Static Tripod (Locked-off)</option>
                      <option value="360 Hero Orbit">360 Hero Orbit</option>
                      <option value="Slow Zoom In">Slow Dramatic Zoom In</option>
                      <option value="Fast Punch Zoom">Fast Punch Zoom</option>
                      <option value="Dolly In (Push In)">Dolly In (Push In)</option>
                      <option value="FPV Drone Chase">FPV Drone Chase</option>
                      <option value="Handheld Shaky-cam">Handheld Action</option>
                      <option value="Crane Down Jib">Crane Down Jib</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#717f92] uppercase">Optical Look & Texture:</label>
                    <select
                      value={revisedLook}
                      onChange={(e) => setRevisedLook(e.target.value)}
                      className="w-full bg-[#171c26] border border-[#293447] text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-yellow-400"
                    >
                      <option value="Default Neutral">Default Neutral</option>
                      <option value="Anamorphic 2.39:1">Anamorphic 2.39:1 (Blue Flares)</option>
                      <option value="Warm 35mm Halation">Warm 35mm Halation (Kodak 500T)</option>
                      <option value="35mm Film Grain">35mm Film Grain</option>
                      <option value="Vintage 90s VHS">Vintage 90s VHS</option>
                      <option value="Cinematic Golden Hour">Cinematic Golden Hour</option>
                      <option value="Moody Cyberpunk Neon">Cyberpunk Neon</option>
                      <option value="Gothic Film Noir">Gothic Noir</option>
                      <option value="Clean Commercial Studio">Clean Commercial Studio</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#8695a8] uppercase">Motion Dynamics:</span>
                      <span className="font-mono text-yellow-400 font-bold">{motionIntensity}/10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={motionIntensity}
                      onChange={(e) => setMotionIntensity(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-[#252f40] rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: EXTEND SHOT */}
              {editMode === 'extend' && (
                <div className="space-y-3 bg-[#161c26] p-4 rounded-xl border border-[#273244]">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>Extend Video Duration (Sequel Mode)</span>
                  </div>
                  <p className="text-[11px] text-[#8695aa] leading-relaxed">
                    Extends this shot forward from its final keyframe without re-rendering the first part, guaranteeing continuous action.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    {[5, 8, 10, 15].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setExtendSeconds(sec)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition border ${
                          extendSeconds === sec
                            ? 'bg-emerald-400 text-black border-emerald-400 shadow'
                            : 'bg-[#1b2230] text-[#91a0b3] border-[#293548] hover:text-white'
                        }`}
                      >
                        +{sec}s
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subfolder Destination */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-[#717f92] uppercase flex items-center gap-1">
                  <Folder className="w-3 h-3 text-yellow-400" />
                  <span>Save Into Project Subfolder:</span>
                </label>
                <select
                  value={revisedFolderId}
                  onChange={(e) => setRevisedFolderId(e.target.value)}
                  className="w-full bg-[#171c26] border border-[#293447] text-xs text-white rounded-xl p-2 focus:outline-none focus:border-yellow-400"
                >
                  {currentProject.folders.filter(f => f.id !== 'all').map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.parentId ? `  ↳ ${folder.name}` : `📁 ${folder.name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons: Save Edits & Render Revision */}
            <div className="pt-4 border-t border-[#222a38] space-y-2">
              {savedSuccess && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>Saved edited version to project library!</span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveMetadataOnly}
                  className="flex-1 py-2.5 rounded-xl bg-[#1d2432] hover:bg-[#273244] border border-[#313e54] text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-yellow-400" />
                  <span>Save Edits</span>
                </button>

                <button
                  type="button"
                  onClick={handleDispatchReRender}
                  disabled={isGenerating}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                    isGenerating
                      ? 'bg-yellow-200 text-black/60 cursor-not-allowed'
                      : 'bg-[#e2fb42] hover:bg-[#d4ed37] text-black active:scale-[0.98]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-black" />
                      <span>Revising Video...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>{editMode === 'extend' ? `Extend (+${extendSeconds}s)` : 'Render Revised Cut'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
