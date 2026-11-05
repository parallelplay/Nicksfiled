'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Camera, 
  Film, 
  Clapperboard, 
  Sun, 
  Layers, 
  ArrowRight, 
  Check, 
  Wand2, 
  Sliders, 
  Play, 
  Clock, 
  AtSign,
  Copy,
  FolderOpen,
  X
} from 'lucide-react';
import { Project, ElementReference } from '@/types';

interface DirectorStudioProps {
  currentProject: Project;
  globalElements: ElementReference[];
  onApplyPrompt: (enhancedPrompt: string, cameraMove?: string, opticalLook?: string) => void;
  onGenerateShot: (prompt: string, selectedElements: ElementReference[], settings?: any) => void;
  onClose?: () => void;
}

export default function DirectorStudio({
  currentProject,
  globalElements = [],
  onApplyPrompt,
  onGenerateShot,
  onClose,
}: DirectorStudioProps) {
  const [activeTab, setActiveTab] = useState<'enhancer' | 'storyboard' | 'camera_library'>('enhancer');
  
  // Prompt Enhancer State
  const [rawIdea, setRawIdea] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Anamorphic 35mm Hollywood');
  const [selectedPacing, setSelectedPacing] = useState('Dynamic & Epic');
  const [selectedCamera, setSelectedCamera] = useState('360 Orbit');
  const [enhancedResult, setEnhancedResult] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Storyboard Breakdown State
  const [storyboardShots, setStoryboardShots] = useState<Array<{
    shotNumber: number;
    title: string;
    camera: string;
    prompt: string;
    duration: string;
  }>>([
    {
      shotNumber: 1,
      title: 'Establishing Scene',
      camera: 'Extreme Wide Crane Down',
      prompt: `Extreme wide cinematic establishing shot of ${currentProject.title} environment, golden hour atmospheric haze, 35mm film grain, volumetric god rays, hyper-detailed photorealism.`,
      duration: '8s',
    },
    {
      shotNumber: 2,
      title: 'Character Entrance',
      camera: 'Low Angle Steadycam Tracking',
      prompt: `Low-angle tracking shot following character walking through scene, cinematic rim lighting, shallow depth of field, anamorphic horizontal flare, intense cinematic expression.`,
      duration: '8s',
    },
    {
      shotNumber: 3,
      title: 'Product / Prop Close-Up',
      camera: 'Slow Macro Push-In',
      prompt: `Macro 4K close-up shot focusing on intricate craftsmanship, reflection glints, razor-sharp focus, studio 3-point softbox lighting, 24fps cinema cadence.`,
      duration: '5s',
    },
    {
      shotNumber: 4,
      title: 'Climactic Hero Shot',
      camera: '360 Orbital Gimbal Rotation',
      prompt: `Dramatic 360-degree orbital rotation around the hero in the center, wind blowing particles, cinematic color grading, Kodak 500T warm halation, master cut.`,
      duration: '10s',
    },
  ]);

  // Combined pool of available elements
  const allElements = [...globalElements, ...currentProject.elements];

  // AI Prompt Enhancement Engine
  const handleEnhancePrompt = () => {
    if (!rawIdea.trim()) return;
    setIsEnhancing(true);

    setTimeout(() => {
      // Find any element tags mentioned or pick the first character if available
      const firstChar = allElements.find(e => e.category === 'character');
      const charTag = firstChar ? firstChar.tag : '';

      const cameraDirectives: Record<string, string> = {
        '360 Orbit': 'Smooth 360-degree orbital rotation keeping subject centered',
        'Dolly In': 'Cinematic slow push-in dolly shot emphasizing emotional gravity',
        'FPV Drone Chase': 'Dynamic high-speed FPV drone tracking through the environment',
        'Low Angle Hero': 'Dramatic low-angle hero perspective looking up, volumetric rim light',
        'Static Tripod': 'Master locked-off tripod shot with rich organic ambient motion',
        'Handheld Shaky-cam': 'Gritty guerrilla handheld camera with authentic kinetic momentum',
      };

      const styleDirectives: Record<string, string> = {
        'Anamorphic 35mm Hollywood': 'Cinematic 2.39:1 anamorphic format, subtle blue horizontal flares, 35mm Kodak 500T film grain, soft warm halation',
        'Cyberpunk Neon Noir': 'Volumetric neon haze, teal and orange high-contrast grade, rain-slicked reflective surfaces, deep moody shadows',
        'Golden Hour Sunset': 'Warm directional sunset backlighting, atmospheric dust motes, rich amber rim highlights, high dynamic range',
        'Gothic Chiaroscuro': 'Dark high-contrast chiaroscuro lighting, deep silhouetted forms, silver-halide film texture, theatrical mood',
        'Clean Commercial Studio': 'Commercial high-key 3-point diffused softbox lighting, flawless reflections, razor-sharp edge definition',
      };

      const camText = cameraDirectives[selectedCamera] || cameraDirectives['360 Orbit'];
      const styleText = styleDirectives[selectedStyle] || styleDirectives['Anamorphic 35mm Hollywood'];

      const enhanced = [
        rawIdea.trim(),
        charTag ? `[Primary Subject: ${charTag} with 100% 1:1 facial identity lock]` : '',
        `[Camera Movement: ${camText}]`,
        `[Visual Tone & Optics: ${styleText}]`,
        `[Cadence: 24fps master cinema render, native DiT diffusion depth, uncompressed 1080p clarity]`,
      ].filter(Boolean).join(', ');

      setEnhancedResult(enhanced);
      setIsEnhancing(false);
    }, 700);
  };

  const handleCopy = () => {
    if (enhancedResult) {
      navigator.clipboard.writeText(enhancedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-5 p-2 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#171b24] via-[#12151b] to-[#1a1f2c] border border-[#2b3547] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-yellow-400/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black shadow-[0_0_24px_rgba(234,179,8,0.3)]">
              <Clapperboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide text-white uppercase">
                  Director AI Copilot
                </h1>
                <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-mono font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
                  Higgsfield Cinema Studio
                </span>
              </div>
              <p className="text-xs text-[#8c9bb0] mt-0.5">
                AI Director assistance for {currentProject.title} • Script expansion, shot breakdowns & camera choreography
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-[#728094] hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
              title="Close Director View"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 border-t border-[#232b3a] pt-4">
          {[
            { id: 'enhancer', label: 'Cinematic Prompt Enhancer', icon: Wand2 },
            { id: 'storyboard', label: 'Multi-Shot Storyboard', icon: Layers },
            { id: 'camera_library', label: 'Director Camera Library', icon: Camera },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-yellow-400 text-black shadow-lg font-extrabold'
                    : 'bg-[#151a23] text-[#8695aa] hover:text-white hover:bg-[#1d2432] border border-[#232c3d]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CINEMATIC PROMPT ENHANCER */}
      {activeTab === 'enhancer' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Controls */}
          <div className="md:col-span-6 space-y-4 bg-[#12161f] border border-[#232b3a] rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>Input Scene Premise</span>
            </h2>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#8b9aa8]">Your Core Idea or Script Line:</label>
              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="e.g. Kabir arrives at the desert palace on a vintage motorcycle, dust swirling, sunset rim lighting..."
                className="w-full h-28 bg-[#0b0e13] border border-[#252f40] focus:border-yellow-400 rounded-xl p-3 text-xs text-white placeholder-[#505c6e] focus:outline-none transition resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Locked Elements Quick Insert */}
            {allElements.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-[#6d7b8d] uppercase tracking-wider flex items-center gap-1">
                  <AtSign className="w-3 h-3 text-yellow-400" />
                  <span>Click to Include Locked Reference:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allElements.slice(0, 6).map(el => (
                    <button
                      key={el.id}
                      onClick={() => setRawIdea(prev => `${prev ? prev.trim() + ' ' : ''}${el.tag}`)}
                      className="px-2 py-1 rounded-lg bg-[#18202c] hover:bg-[#232e3f] text-[#a0b0c5] hover:text-yellow-300 border border-[#273347] text-[10px] font-mono flex items-center gap-1 transition"
                    >
                      <img src={el.thumbnail} alt={el.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>{el.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Director Presets */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#717f92] uppercase">Camera Movement:</label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full bg-[#171c26] border border-[#293447] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-yellow-400"
                >
                  <option value="360 Orbit">360 Hero Orbit</option>
                  <option value="Dolly In">Dolly In (Push In)</option>
                  <option value="FPV Drone Chase">FPV Drone Chase</option>
                  <option value="Low Angle Hero">Low Angle Hero</option>
                  <option value="Static Tripod">Static Tripod</option>
                  <option value="Handheld Shaky-cam">Handheld Action</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#717f92] uppercase">Lighting & Optics:</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full bg-[#171c26] border border-[#293447] text-xs text-white rounded-lg p-2 focus:outline-none focus:border-yellow-400"
                >
                  <option value="Anamorphic 35mm Hollywood">Anamorphic 35mm</option>
                  <option value="Cyberpunk Neon Noir">Cyberpunk Neon</option>
                  <option value="Golden Hour Sunset">Golden Hour Sunset</option>
                  <option value="Gothic Chiaroscuro">Gothic Noir</option>
                  <option value="Clean Commercial Studio">Commercial Studio</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !rawIdea.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                !rawIdea.trim()
                  ? 'bg-[#1b222f] text-[#556477] cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-400/20 active:scale-[0.99]'
              }`}
            >
              {isEnhancing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-black" />
                  <span>Synthesizing Hollywood Shot...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Enhance with Director AI</span>
                </>
              )}
            </button>
          </div>

          {/* Right Enhanced Output */}
          <div className="md:col-span-6 space-y-4 bg-[#12161f] border border-[#232b3a] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-4 h-4 text-emerald-400" />
                  <span>Director Augmented Prompt</span>
                </h2>

                {enhancedResult && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-yellow-300 hover:text-white transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              {enhancedResult ? (
                <div className="p-3.5 rounded-xl bg-[#0b0e13] border border-[#242d3d] text-xs text-[#cbd8ea] leading-relaxed font-sans select-text">
                  {enhancedResult}
                </div>
              ) : (
                <div className="h-44 rounded-xl border border-dashed border-[#232a38] flex flex-col items-center justify-center text-center p-4 text-[#5e6d81]">
                  <Wand2 className="w-7 h-7 text-[#465366] mb-2" />
                  <span className="text-xs font-semibold text-[#8b9aa8]">Director Prompt Canvas</span>
                  <p className="text-[11px] text-[#556375] mt-1 max-w-xs">
                    Type your core premise on the left and click "Enhance with Director AI" to generate cinema-grade shot conditioning.
                  </p>
                </div>
              )}
            </div>

            {/* Actions: Send to Canvas */}
            {enhancedResult && (
              <div className="pt-2 flex items-center gap-2.5">
                <button
                  onClick={() => onApplyPrompt(enhancedResult, selectedCamera, selectedStyle)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1e2532] hover:bg-[#283244] border border-[#313d52] text-xs font-bold text-white transition flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 text-yellow-400" />
                  <span>Load into Cinema Canvas</span>
                </button>

                <button
                  onClick={() => onGenerateShot(enhancedResult, allElements)}
                  className="py-2.5 px-5 rounded-xl bg-[#e2fb42] hover:bg-[#d4ed37] text-black font-black text-xs uppercase tracking-wide transition shadow-lg flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Render Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-SHOT STORYBOARD */}
      {activeTab === 'storyboard' && (
        <div className="space-y-4 bg-[#12161f] border border-[#232b3a] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#212938]">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-400" />
                <span>Multi-Shot Sequence Storyboard ({storyboardShots.length} Shots)</span>
              </h2>
              <p className="text-[11px] text-[#7d8c9f] mt-0.5">
                Cohesive 4-shot narrative progression designed for continuous multi-scene storytelling.
              </p>
            </div>

            <button
              onClick={() => {
                const nextNum = storyboardShots.length + 1;
                setStoryboardShots(prev => [
                  ...prev,
                  {
                    shotNumber: nextNum,
                    title: `Shot 0${nextNum}: Sequence Climax`,
                    camera: 'Dynamic Steadycam Follow',
                    prompt: `Cinematic continuation shot 0${nextNum} in ${currentProject.title}, matching narrative continuity and character wardrobe.`,
                    duration: '8s',
                  },
                ]);
              }}
              className="px-3 py-1.5 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 text-yellow-300 text-xs font-bold transition flex items-center gap-1"
            >
              + Add Scene Shot
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {storyboardShots.map(shot => (
              <div
                key={shot.shotNumber}
                className="bg-[#0b0e13] border border-[#212937] hover:border-yellow-400/50 rounded-xl p-3.5 space-y-2.5 transition flex flex-col justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded border border-yellow-400/30">
                      SHOT #{shot.shotNumber}
                    </span>
                    <span className="text-[10px] font-mono text-[#768497]">{shot.duration}</span>
                  </div>
                  <div className="font-bold text-xs text-white truncate">{shot.title}</div>
                  <div className="text-[10px] font-semibold text-cyan-400 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    <span>{shot.camera}</span>
                  </div>
                  <p className="text-[11px] text-[#8695a8] line-clamp-3 leading-relaxed">
                    {shot.prompt}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onApplyPrompt(shot.prompt, shot.camera)}
                    className="flex-1 py-1.5 rounded-lg bg-[#19202b] hover:bg-[#232d3d] text-white text-[11px] font-semibold border border-[#2b3648] transition flex items-center justify-center gap-1"
                  >
                    <span>Load Shot</span>
                    <ArrowRight className="w-3 h-3 text-yellow-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DIRECTOR CAMERA LIBRARY */}
      {activeTab === 'camera_library' && (
        <div className="space-y-4 bg-[#12161f] border border-[#232b3a] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[#212938]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-yellow-400" />
              <span>Higgsfield Director Camera Presets (30+ Movements)</span>
            </h2>
            <span className="text-xs text-[#717e90]">Click any preset to add to prompt</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: '360 Hero Orbit', desc: 'Full orbital rotation around character', dir: 'Smooth 360-degree orbital rotation keeping subject centered' },
              { name: 'FPV Drone Pursuit', desc: 'Fast dynamic dive and pursuit flight', dir: 'Dynamic FPV drone shot sweeping fast through scene' },
              { name: 'Dolly Push-In', desc: 'Slow cinematic push into character eyes', dir: 'Cinematic slow push-in dolly shot emphasizing emotional gravity' },
              { name: 'Crane Down Jib', desc: 'Epic vertical descent from sky to ground', dir: 'High-angle cinematic crane jib sweeping downward' },
              { name: 'Low Angle Hero', desc: 'Low perspective emphasizing scale & power', dir: 'Dramatic low-angle hero perspective with volumetric rim lighting' },
              { name: 'Vertigo Dolly Zoom', desc: 'Hitchcock zolly background warp', dir: 'Cinematic vertigo dolly zoom warp effect' },
              { name: 'Tracking Steadycam', desc: 'Smooth horizontal glide following subject', dir: 'Dynamic steadycam tracking camera following subject' },
              { name: 'Macro Close-Up', desc: 'Ultra-close lens with razor bokeh', dir: 'Macro 4K close-up shot with shallow depth of field' },
              { name: 'Handheld Shaky-cam', desc: 'Authentic documentary action realism', dir: 'Gritty guerrilla handheld camera with authentic kinetic momentum' },
              { name: 'Whip Pan Transition', desc: 'High velocity snap rotation', dir: 'Fast dynamic whip pan transition with motion blur' },
              { name: 'Dutch Angle 15°', desc: 'Tilted dramatic tension perspective', dir: 'Tilted 15-degree Dutch angle cinematic perspective' },
              { name: 'Static Locked-off', desc: 'Classic tripod master shot', dir: 'Master locked-off tripod shot with rich organic ambient motion' },
            ].map(c => (
              <div
                key={c.name}
                onClick={() => onApplyPrompt(c.dir, c.name)}
                className="bg-[#0b0e13] border border-[#212836] hover:border-yellow-400/60 p-3 rounded-xl cursor-pointer transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white group-hover:text-yellow-300 transition">{c.name}</span>
                    <Camera className="w-3.5 h-3.5 text-[#5e6b7d] group-hover:text-yellow-400 transition" />
                  </div>
                  <p className="text-[11px] text-[#78879b] mt-1 leading-snug">{c.desc}</p>
                </div>
                <div className="mt-2 text-[10px] text-yellow-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  <span>Apply to Prompt</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
