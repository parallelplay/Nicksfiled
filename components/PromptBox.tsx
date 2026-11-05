'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play,
  Plus, 
  AtSign, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  X, 
  Volume2, 
  VolumeX, 
  Zap, 
  Check, 
  Layers,
  Minus,
  UploadCloud,
  ArrowRight,
  ArrowLeft,
  Scissors,
  ArrowUpDown,
  ImageIcon,
  VideoIcon,
  Music2,
  Film,
  Camera,
  Sun,
  Flame,
  Compass
} from 'lucide-react';
import { ElementReference } from '@/types';

export interface GenerationSettings {
  model: string;
  aspectRatio: string;
  resolution: string;
  duration: string;
  bitrate: 'High' | 'Standard';
  sound: boolean;
  batchCount: number;
  referenceMode: 'References' | 'Sequel' | 'Prequel' | 'Edit video';
  referencesCount: number;
  cameraMovement?: string;
  opticalLook?: string;
  lightingStyle?: string;
  firstFrameImage?: string;
  motionStrength?: number;
}

interface PromptBoxProps {
  availableElements: ElementReference[];
  onGenerate: (prompt: string, selectedElements: ElementReference[], settings: GenerationSettings) => void;
  isGenerating: boolean;
  projectTitle?: string;
  hasPreviousShots?: boolean;
  initialPrompt?: string;
  initialElements?: ElementReference[];
  onPromptChange?: (prompt: string) => void;
}

export default function PromptBox({ 
  availableElements = [], 
  onGenerate, 
  isGenerating,
  projectTitle = 'Film Project',
  hasPreviousShots = false,
  initialPrompt = '',
  initialElements = [],
  onPromptChange,
}: PromptBoxProps) {
  // STRICTLY EMPTY BY DEFAULT: Prompt starts completely clean
  const [promptText, setPromptText] = useState(initialPrompt);

  // Active Pinned Elements - perfectly synchronized with @tags in promptText
  const [activeElements, setActiveElements] = useState<ElementReference[]>(initialElements);

  // Update when initialPrompt / initialElements props change externally
  useEffect(() => {
    if (initialPrompt !== undefined) {
      setPromptText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (initialElements && initialElements.length > 0) {
      setActiveElements(initialElements);
    }
  }, [initialElements]);

  // Media Drawer State (Triggered by + button)
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(false);
  const [mediaDrawerTab, setMediaDrawerTab] = useState<'Uploads' | 'Elements' | 'Generations' | 'Liked'>('Uploads');
  const [mediaFilter, setMediaFilter] = useState<'Recent' | 'All' | 'Images' | 'Videos' | 'Audio'>('Recent');
  const [elementCategoryFilter, setElementCategoryFilter] = useState<'All' | 'Characters' | 'Locations' | 'Props'>('All');

  // Uploaded Media List
  const [userUploads, setUserUploads] = useState<Array<{ id: string; url: string; title: string; type: string }>>([]);

  // User Uploaded Reference Elements (available for @ mention & pinning)
  const [uploadedElements, setUploadedElements] = useState<ElementReference[]>([]);

  // Autocomplete state for @ mention
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Dropdown States
  const [openDropdown, setOpenDropdown] = useState<'aspectRatio' | 'quality' | 'duration' | 'bitrate' | 'references' | 'camera' | 'optical' | null>(null);

  // Generation Controls
  const [model, setModel] = useState('Seedance 2.5');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [duration, setDuration] = useState('8s');
  const [referenceMode, setReferenceMode] = useState<'References' | 'Sequel' | 'Prequel' | 'Edit video'>('References');
  const [bitrate, setBitrate] = useState<'High' | 'Standard'>('High');
  const [sound, setSound] = useState(true);
  const [batchCount, setBatchCount] = useState(1);
  const [cameraMovement, setCameraMovement] = useState<string>('Auto Camera');
  const [opticalLook, setOpticalLook] = useState<string>('Default Neutral');
  const [firstFrameImage, setFirstFrameImage] = useState<string | null>(null);
  const [motionStrength, setMotionStrength] = useState<number>(7);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstFrameInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // BIDIRECTIONAL SYNC: Synchronize activeElements with @tags present in text
  const syncElementsWithText = useCallback((text: string, current: ElementReference[]) => {
    // Find all valid @tag tokens in text
    const matches = text.match(/@[a-zA-Z0-9_\-]+/g) || [];
    const uniqueTags = Array.from(new Set(matches));

    // STRICT REMOVAL: Keep ONLY elements whose tag is still present in the text!
    // If the user removed @ or backspaced the tag, it is IMMEDIATELY filtered out here!
    const kept = current.filter(el => uniqueTags.includes(el.tag));

    const elementPool = [...uploadedElements, ...availableElements];

    // For any tag present in text that is not yet in kept, find and add it
    uniqueTags.forEach(tag => {
      if (!kept.some(el => el.tag === tag)) {
        const found = elementPool.find(e => e.tag.toLowerCase() === tag.toLowerCase());
        if (found) {
          kept.push(found);
        } else if (tag.length > 2) {
          // Clean dynamic element badge for custom typed tag
          kept.push({
            id: `tag-${tag}`,
            name: tag.replace(/^@/, ''),
            tag: tag,
            category: tag.includes('img') ? 'prop' : tag.includes('char') ? 'character' : tag.includes('prop') ? 'prop' : tag.includes('loc') ? 'location' : 'character',
            thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
            description: 'Custom reference in prompt',
            referenceImages: [],
          });
        }
      }
    });

    return kept;
  }, [availableElements, uploadedElements]);

  // Handle textarea text change with instant @ tag detection & sync
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setPromptText(value);
    if (onPromptChange) onPromptChange(value);

    // INSTANT REMOVAL & ADDITION: sync chips immediately on every keystroke
    setActiveElements(prev => syncElementsWithText(value, prev));

    // ACCURATE @ MENTION TRIGGER:
    // Only trigger if cursor is actively at an @mention token (e.g. "@" or "@kabir" at end of word)
    const textBeforeCursor = value.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\-]*)$/);

    if (mentionMatch) {
      setShowMentionMenu(true);
      setMentionQuery(mentionMatch[1]);
      // Calculate the start position of @
      const matchFull = mentionMatch[0];
      const atOffset = matchFull.startsWith(' ') ? 1 : 0;
      setMentionCursorPos(textBeforeCursor.length - matchFull.length + atOffset);
    } else {
      // If user backspaced over @, CLOSE mention menu immediately!
      setShowMentionMenu(false);
      setMentionQuery('');
      setMentionCursorPos(null);
    }
  };

  // Select an element from @ autocomplete menu
  const handleSelectMention = (element: ElementReference) => {
    let updatedText = '';

    if (mentionCursorPos !== null && textareaRef.current) {
      const before = promptText.slice(0, mentionCursorPos);
      const after = promptText.slice(textareaRef.current.selectionStart);
      updatedText = `${before}${element.tag} ${after}`;
    } else {
      // Direct insertion (from Drawer or @ button)
      const trimmed = promptText.trim();
      updatedText = trimmed ? `${trimmed} ${element.tag} ` : `${element.tag} `;
    }

    setPromptText(updatedText);
    if (onPromptChange) onPromptChange(updatedText);

    // Close mention menu
    setShowMentionMenu(false);
    setMentionQuery('');
    setMentionCursorPos(null);

    // Synchronize active elements
    setActiveElements(prev => {
      const exists = prev.some(e => e.tag === element.tag);
      return exists ? prev : [...prev, element];
    });

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Click 'x' on an active reference chip:
  // REMOVES the chip AND cleanly REMOVES @tag from promptText!
  const removePinnedElement = (id: string) => {
    const elem = activeElements.find(e => e.id === id);
    if (elem) {
      // Cleanly remove the tag from promptText (handling spaces and punctuation)
      const escapedTag = elem.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escapedTag}(?=[\\s,.;!?]|$)`, 'g');
      const updatedText = promptText
        .replace(regex, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      setPromptText(updatedText);
      if (onPromptChange) onPromptChange(updatedText);
    }
    // Remove from active elements
    setActiveElements(prev => prev.filter(e => e.id !== id));
  };

  // Render prompt text with neon yellow/lime highlight for referenced tags (@img01, @char, etc.)
  const renderHighlightedPrompt = () => {
    if (!promptText) return null;
    const parts = promptText.split(/(@[a-zA-Z0-9_\-]+)/g);
    return parts.map((part, index) => {
      const isTag = part.startsWith('@');
      const isReferenced = isTag && activeElements.some(
        el => el.tag.toLowerCase() === part.toLowerCase()
      );

      if (isReferenced) {
        return (
          <span
            key={index}
            className="font-bold text-[#e2fb42] bg-[#e2fb42]/15 rounded px-1 -mx-0.5 shadow-[0_0_8px_rgba(226,251,66,0.4)]"
          >
            {part}
          </span>
        );
      } else if (isTag) {
        return (
          <span key={index} className="text-[#e2fb42]/80 font-medium">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Higgsfield Cinema Studio Mode Presets
  const handleSelectReferenceMode = (mode: 'References' | 'Sequel' | 'Prequel' | 'Edit video') => {
    setReferenceMode(mode);
    setOpenDropdown(null);

    if (mode === 'Sequel') {
      if (!promptText.includes('[Sequel:')) {
        const next = (promptText ? promptText.trim() + '\n' : '') + '[Sequel: Continuous multi-shot continuation from previous scene, preserving character vector and lighting]';
        setPromptText(next);
        if (onPromptChange) onPromptChange(next);
      }
    } else if (mode === 'Prequel') {
      if (!promptText.includes('[Prequel:')) {
        const next = (promptText ? promptText.trim() + '\n' : '') + '[Prequel: Establishing camera lead-in shot preceding current scene]';
        setPromptText(next);
        if (onPromptChange) onPromptChange(next);
      }
    } else if (mode === 'Edit video') {
      if (!promptText.includes('[Edit:')) {
        const next = (promptText ? promptText.trim() + '\n' : '') + '[Edit: Inpainting & visual refinement for active shot]';
        setPromptText(next);
        if (onPromptChange) onPromptChange(next);
      }
    } else if (mode === 'References') {
      setIsMediaDrawerOpen(true);
    }
  };

  // Higgsfield Camera Preset Directives
  const handleInsertDirective = (directive: string) => {
    setPromptText(prev => {
      const trimmed = prev.trim();
      let updated = '';
      if (!trimmed) {
        updated = directive;
      } else if (trimmed.includes(directive)) {
        updated = trimmed;
      } else {
        updated = `${trimmed}, ${directive}`;
      }
      if (onPromptChange) onPromptChange(updated);
      return updated;
    });
  };

  // Unified file processor for both upload input and drag-and-drop
  const handleProcessFiles = (filesList: FileList | File[]) => {
    const files = Array.from(filesList);
    if (files.length === 0) return;

    const newUploads: Array<{ id: string; url: string; title: string; type: string }> = [];
    const newElems: ElementReference[] = [];

    const existingImgCount = [
      ...availableElements, 
      ...userUploads, 
      ...uploadedElements
    ].filter((e: any) => (!e.type || e.type === 'image') && !e.tag?.startsWith('@vid')).length;

    const existingVidCount = [
      ...availableElements, 
      ...userUploads, 
      ...uploadedElements
    ].filter((e: any) => e.type === 'video' || e.tag?.startsWith('@vid')).length;

    files.forEach((file, idx) => {
      const isVideo = file.type.startsWith('video') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);
      const isAudio = file.type.startsWith('audio') || /\.(mp3|wav|ogg|aac|m4a)$/i.test(file.name);
      const uploadType = isVideo ? 'video' : isAudio ? 'audio' : 'image';

      // 1:1 Higgsfield AI sequential tag convention: @img01, @img02, @vid01...
      const seqIndex = isVideo ? (existingVidCount + idx + 1) : (existingImgCount + idx + 1);
      const numStr = String(seqIndex).padStart(2, '0');
      const tag = isVideo ? `@vid${numStr}` : isAudio ? `@audio${numStr}` : `@img${numStr}`;
      const displayName = isVideo ? `Video ${numStr}` : isAudio ? `Audio ${numStr}` : `Image ${numStr}`;
      const tempId = `elem-up-${Date.now()}-${idx}`;

      const newElem: ElementReference = {
        id: tempId,
        name: displayName,
        tag: tag,
        category: isVideo ? 'prop' : 'character',
        thumbnail: URL.createObjectURL(file),
        description: `${displayName} reference (${file.name})`,
        referenceImages: [],
      };

      newUploads.push({
        id: `up-${Date.now()}-${idx}`,
        url: newElem.thumbnail,
        title: displayName,
        type: uploadType,
      });

      newElems.push(newElem);

      // Upload file directly to /api/upload for permanent server disk storage
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            newElem.thumbnail = data.url;
            newElem.referenceImages = [data.url];
            setUploadedElements(prev => prev.map(el => el.id === tempId ? { ...el, thumbnail: data.url, referenceImages: [data.url] } : el));
            setActiveElements(prev => prev.map(el => el.id === tempId ? { ...el, thumbnail: data.url, referenceImages: [data.url] } : el));
          }
        })
        .catch(err => {
          console.warn('[Nickfield Upload] Fallback to base64 for dropped file:', err);
          const reader = new FileReader();
          reader.onload = (e) => {
            const rawUrl = e.target?.result as string;
            if (rawUrl) {
              newElem.thumbnail = rawUrl;
              newElem.referenceImages = [rawUrl];
              setUploadedElements(prev => prev.map(el => el.id === tempId ? { ...el, thumbnail: rawUrl, referenceImages: [rawUrl] } : el));
              setActiveElements(prev => prev.map(el => el.id === tempId ? { ...el, thumbnail: rawUrl, referenceImages: [rawUrl] } : el));
            }
          };
          reader.readAsDataURL(file);
        });
    });

    setUserUploads(prev => [...newUploads, ...prev]);
    setUploadedElements(prev => [...newElems, ...prev]);

    // Automatically select and pin all newly added media
    if (newElems.length > 0) {
      newElems.forEach(el => handleSelectMention(el));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleTriggerGenerate = () => {
    if (!promptText.trim() && activeElements.length === 0) {
      alert('Please enter a scene prompt or mention a Character/Prop/Location with @');
      return;
    }

    onGenerate(promptText, activeElements, {
      model,
      aspectRatio,
      resolution,
      duration,
      bitrate,
      sound,
      batchCount,
      referenceMode,
      referencesCount: activeElements.length,
      cameraMovement,
      opticalLook,
      firstFrameImage: firstFrameImage || undefined,
      motionStrength,
    });
  };

  // Dynamic token calculation based on both resolution and duration
  const durationNumber = parseInt(duration.replace('s', ''), 10) || 5;
  const tokenRatePerSec = resolution === '480p' ? 9680 : resolution === '1080p' ? 49005 : 21780;
  const estimatedTokens = durationNumber * tokenRatePerSec * batchCount;

  // Filter uploaded items for @ mention menu
  const filteredUploadedElements = uploadedElements.filter(e => 
    e.name.toLowerCase().includes(mentionQuery.toLowerCase()) || 
    e.tag.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Filter available character & prop elements for @ mention menu
  const filteredElements = availableElements.filter(e => 
    e.name.toLowerCase().includes(mentionQuery.toLowerCase()) || 
    e.tag.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  // Filter uploads based on mediaFilter (Videos / Images / Audio / All / Recent)
  const filteredUploads = userUploads.filter(up => {
    if (mediaFilter === 'Videos') return up.type === 'video';
    if (mediaFilter === 'Images') return up.type === 'image';
    if (mediaFilter === 'Audio') return up.type === 'audio';
    return true; // 'Recent' or 'All'
  });

  // Filter elements based on elementCategoryFilter (Strictly: All -> Characters -> Locations -> Props)
  const filteredDrawerElements = availableElements.filter(el => {
    if (elementCategoryFilter === 'Characters') return el.category === 'character';
    if (elementCategoryFilter === 'Locations') return el.category === 'location';
    if (elementCategoryFilter === 'Props') return el.category === 'prop';
    return true; // 'All'
  });

  return (
    <div className="w-full max-w-[860px] mx-auto space-y-2.5">
      {/* 1. MEDIA REFERENCE DRAWER (Opens when + is clicked) */}
      {isMediaDrawerOpen && (
        <div className="w-full bg-[#13161a] border border-[#262d3a] rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
          {/* Top Tabs & Close */}
          <div className="flex items-center justify-between border-b border-[#202633] pb-3 mb-3">
            <div className="flex items-center gap-1.5">
              {(['Uploads', 'Elements', 'Generations', 'Liked'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMediaDrawerTab(tab)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                    mediaDrawerTab === tab
                      ? 'bg-white text-black shadow-md'
                      : 'text-[#8792a2] hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setIsMediaDrawerOpen(false)}
              className="text-[#647182] hover:text-white p-1 rounded-full hover:bg-[#202633] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub Filters & Sort */}
          <div className="flex items-center justify-between text-xs mb-3.5">
            {mediaDrawerTab === 'Elements' ? (
              /* Strict Order: All -> Characters -> Locations -> Props */
              <div className="flex items-center gap-1">
                {(['All', 'Characters', 'Locations', 'Props'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setElementCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      elementCategoryFilter === cat
                        ? 'bg-[#222834] text-white shadow-sm font-bold border border-white/10'
                        : 'text-[#727d8e] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {(['Recent', 'All', 'Images', 'Videos', 'Audio'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setMediaFilter(f)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                      mediaFilter === f
                        ? 'bg-[#222834] text-white shadow-sm'
                        : 'text-[#727d8e] hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-[#6d7a8d] font-mono">
              {mediaDrawerTab === 'Elements' ? `${availableElements.length} project references` : ''}
            </span>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-56 overflow-y-auto no-scrollbar">
            {/* 1. UPLOADS TAB */}
            {mediaDrawerTab === 'Uploads' && (
              <>
                {/* Upload Media Card (Dashed) */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-28 rounded-xl border-2 border-dashed border-[#293241] hover:border-yellow-400/60 bg-[#161a22]/60 flex flex-col items-center justify-center text-[#7e8a9b] hover:text-white cursor-pointer transition group shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#202734] group-hover:bg-[#2a3445] flex items-center justify-center mb-1.5 transition">
                    <UploadCloud className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold">Upload media</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Media Cards */}
                {filteredUploads.map(up => {
                  const matchingElem = uploadedElements.find(e => e.thumbnail === up.url);
                  const isCardSelected = activeElements.some(
                    el => el.thumbnail === up.url || (matchingElem && el.tag === matchingElem.tag)
                  );

                  return (
                    <div
                      key={up.id}
                      onClick={() => {
                        const existingEl = uploadedElements.find(e => e.thumbnail === up.url);
                        if (existingEl) {
                          handleSelectMention(existingEl);
                        } else {
                          const isVideo = up.type === 'video';
                          const cleanName = up.title.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 16);
                          const tag = isVideo ? `@vid_${cleanName}` : `@img_${cleanName}`;
                          const newElem: ElementReference = {
                            id: `elem-${up.id}`,
                            name: up.title,
                            tag: tag,
                            category: isVideo ? 'prop' : 'character',
                            thumbnail: up.url,
                            description: `Uploaded reference: ${up.title}`,
                            referenceImages: [up.url],
                          };
                          setUploadedElements(prev => [newElem, ...prev]);
                          handleSelectMention(newElem);
                        }
                        setIsMediaDrawerOpen(false);
                      }}
                      className={`h-28 rounded-xl bg-[#181d25] overflow-hidden relative group cursor-pointer transition-all shadow-md ${
                        isCardSelected 
                          ? 'border-2 border-[#e2fb42] shadow-[0_0_20px_rgba(226,251,66,0.45)] ring-2 ring-[#e2fb42]/40' 
                          : 'border border-[#272f3d] hover:border-yellow-400'
                      }`}
                    >
                      {/* Selected Neon Badge */}
                      {isCardSelected && (
                        <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-full bg-[#e2fb42] text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_#e2fb42]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>SELECTED</span>
                        </div>
                      )}

                      {up.type === 'video' ? (
                        <div className="relative w-full h-full bg-black">
                          <video
                            src={up.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                            onMouseEnter={(e) => {
                              try { e.currentTarget.play().catch(() => {}); } catch {}
                            }}
                            onMouseLeave={(e) => {
                              try { e.currentTarget.pause(); e.currentTarget.currentTime = 0.2; } catch {}
                            }}
                          />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[9px] font-semibold text-cyan-300 flex items-center gap-1 shadow border border-cyan-500/20 pointer-events-none">
                            <Play className="w-2.5 h-2.5 fill-cyan-300" />
                            <span>VIDEO</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-1.5 pointer-events-none">
                            <span className="text-[10px] font-bold text-white truncate">{up.title}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img src={up.url} alt={up.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[9px] font-semibold text-emerald-400 flex items-center gap-1 shadow border border-emerald-500/20">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>IMG</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-[10px] font-bold text-white truncate">{up.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredUploads.length === 0 && (
                  <div className="col-span-full py-6 flex flex-col items-center justify-center text-center text-[#616e80]">
                    <p className="text-xs">
                      {mediaFilter === 'Videos' 
                        ? 'No videos uploaded yet. Click "+ Upload media" to add MP4 or MOV clips.' 
                        : mediaFilter === 'Images'
                        ? 'No images uploaded yet. Click "+ Upload media" to add JPG or PNG photos.'
                        : 'No uploads yet. Click "+ Upload media" above.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 2. ELEMENTS TAB (Strictly character & prop references) */}
            {mediaDrawerTab === 'Elements' && (
              <>
                {filteredDrawerElements.length > 0 ? (
                  filteredDrawerElements.map(el => {
                    const isElementSelected = activeElements.some(
                      active => active.id === el.id || active.tag.toLowerCase() === el.tag.toLowerCase()
                    );

                    return (
                      <div
                        key={el.id}
                        onClick={() => {
                          handleSelectMention(el);
                          setIsMediaDrawerOpen(false);
                        }}
                        className={`h-28 rounded-xl bg-[#181d25] overflow-hidden relative group cursor-pointer transition-all shadow-md ${
                          isElementSelected
                            ? 'border-2 border-[#e2fb42] shadow-[0_0_20px_rgba(226,251,66,0.45)] ring-2 ring-[#e2fb42]/40'
                            : 'border border-[#272f3d] hover:border-yellow-400'
                        }`}
                      >
                        {isElementSelected && (
                          <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded-full bg-[#e2fb42] text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_10px_#e2fb42]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>SELECTED</span>
                          </div>
                        )}
                        <img src={el.thumbnail} alt={el.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-1.5">
                          <span className="text-[10px] font-mono text-yellow-300 font-bold truncate">{el.tag}</span>
                          <span className="text-[9px] text-[#93a0b2] truncate">{el.name}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-6 flex flex-col items-center justify-center text-center text-[#616e80]">
                    <p className="text-xs">
                      {mediaFilter === 'Videos' 
                        ? 'Character & Prop elements are image references. Switch filter to "All" or "Images" to view character elements.' 
                        : 'No elements available in this category.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 3. GENERATIONS TAB */}
            {mediaDrawerTab === 'Generations' && (
              <div className="col-span-full py-6 flex flex-col items-center justify-center text-center text-[#616e80]">
                <Film className="w-6 h-6 mb-2 text-[#434d5d]" />
                <p className="text-xs">Previous video generations from this project will appear here as reference shots.</p>
              </div>
            )}

            {/* 4. LIKED TAB */}
            {mediaDrawerTab === 'Liked' && (
              <div className="col-span-full py-6 flex flex-col items-center justify-center text-center text-[#616e80]">
                <Sparkles className="w-6 h-6 mb-2 text-[#434d5d]" />
                <p className="text-xs">No starred or liked assets yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN FLOATING PROMPT BOX (With Full Drag & Drop Support) */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleProcessFiles(e.dataTransfer.files);
          }
        }}
        className={`w-full bg-[#13161a] border rounded-2xl shadow-2xl relative overflow-visible backdrop-blur-xl transition-all duration-200 ${
          isDraggingOver 
            ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-[0_0_35px_rgba(250,204,21,0.25)]' 
            : 'border-[#232934]'
        }`}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-50 rounded-2xl bg-[#10141d]/95 border-2 border-dashed border-yellow-400 flex flex-col items-center justify-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-lg animate-bounce">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white tracking-wide">
              Drop image or video here to add as Reference
            </div>
            <div className="text-xs text-yellow-300 font-mono">
              Auto-pins @img / @char reference & optimizes resolution
            </div>
          </div>
        )}

        {/* Top Pinned Element Chips & First Frame Keyframe condition */}
        {(activeElements.length > 0 || firstFrameImage) && (
          <div className="flex items-center gap-2 px-3.5 pt-3 pb-1 overflow-x-auto no-scrollbar border-b border-[#1b1f26]">
            {firstFrameImage && (
              <div className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 text-xs shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <img src={firstFrameImage} alt="First Frame" className="w-5 h-5 rounded object-cover border border-cyan-400/50" />
                <span className="font-bold text-[10px] uppercase font-mono tracking-wider">Start Frame</span>
                <button
                  type="button"
                  onClick={() => setFirstFrameImage(null)}
                  className="hover:bg-cyan-400/20 rounded p-0.5 text-cyan-200 transition ml-0.5"
                  title="Remove start frame keyframe"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {activeElements.length > 0 && (
              <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <AtSign className="w-3 h-3 text-[#e2fb42]" />
                <span>ACTIVE REFERENCES ({activeElements.length}):</span>
              </span>
            )}
            {activeElements.map(el => (
              <div 
                key={el.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#151921] border border-[#263040] hover:border-[#38455a] text-white text-xs group shrink-0 transition"
              >
                <img 
                  src={el.thumbnail} 
                  alt={el.name} 
                  className="w-5 h-5 rounded object-cover border border-[#333f52]" 
                />
                <span className="font-bold text-[#e2fb42] text-[11px] font-mono tracking-wide">{el.tag}</span>
                <span className="text-[10px] text-[#64748b] hidden sm:inline truncate max-w-[90px]">({el.name})</span>
                <button 
                  type="button"
                  onClick={() => removePinnedElement(el.id)}
                  className="text-[#64748b] hover:text-white p-0.5 rounded transition"
                  title="Remove from prompt"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Prompt Textarea */}
        <div className="relative p-3.5 pb-2">
          <textarea
            ref={textareaRef}
            value={promptText}
            onChange={handleTextChange}
            placeholder="Describe your scene or type @ to mention Characters, Props, or Locations..."
            rows={4}
            className="w-full bg-transparent text-white text-[13px] leading-relaxed resize-none focus:outline-none placeholder-[#545d6a] font-sans selection:bg-[#e2fb42]/30 selection:text-white caret-[#e2fb42]"
          />

          {/* Smart @ Mention Dropdown Popover */}
          {showMentionMenu && (
            <div className="absolute left-4 top-20 z-50 w-80 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-white max-h-72 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95">
              
              {/* 1. Uploaded Images & Media References (Shows at the TOP!) */}
              {filteredUploadedElements.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-bold text-yellow-400 uppercase tracking-wider flex items-center justify-between border-b border-[#252c38] mb-1">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-yellow-400" />
                      <span>Uploaded Images & Media</span>
                    </span>
                    <span className="font-mono text-[9px] text-[#8e9cae]">{filteredUploadedElements.length} files</span>
                  </div>
                  {filteredUploadedElements.map(el => (
                    <button
                      key={el.id}
                      onClick={() => handleSelectMention(el)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#222936] text-left transition group border border-transparent hover:border-yellow-400/40"
                    >
                      <img src={el.thumbnail} alt={el.name} className="w-7 h-7 rounded object-cover border border-[#333d4e] shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-white truncate flex items-center justify-between">
                          <span className="truncate">{el.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-yellow-400/20 text-yellow-300 font-mono shrink-0">
                            UPLOADED
                          </span>
                        </div>
                        <div className="text-[10px] text-yellow-400 font-mono truncate">{el.tag}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Character, Prop & Location Elements */}
              <div>
                <div className="px-2 py-1 text-[10px] font-bold text-[#6a7482] uppercase tracking-wider flex items-center justify-between">
                  <span>Characters, Props & Locations</span>
                  <span className="text-yellow-400 font-mono text-[9px]">{filteredElements.length} available</span>
                </div>
                {filteredElements.length === 0 && filteredUploadedElements.length === 0 ? (
                  <div className="p-3 text-center text-[#788596] text-[11px]">
                    No matching references found for "@{mentionQuery}".
                  </div>
                ) : (
                  filteredElements.map(el => (
                    <button
                      key={el.id}
                      onClick={() => handleSelectMention(el)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#222936] text-left transition group"
                    >
                      <img src={el.thumbnail} alt={el.name} className="w-6 h-6 rounded object-cover border border-[#333d4e] shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          {el.name}
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#2a3240] text-[#93c5fd] uppercase">
                            {el.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-yellow-400 font-mono truncate">{el.tag}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Higgsfield Quick Director: Camera Moves & Atmosphere Presets */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0b0d10] border-t border-[#1a1f27] overflow-x-auto no-scrollbar text-[11px] text-[#717e91]">
          <span className="flex items-center gap-1 text-[#8c9bb0] font-semibold shrink-0">
            <Camera className="w-3 h-3 text-yellow-400" />
            <span>Camera:</span>
          </span>
          {[
            { label: 'Dolly Zoom', dir: 'Cinematic vertigo dolly zoom' },
            { label: 'Tracking Shot', dir: 'Dynamic steadycam tracking camera following subject' },
            { label: 'FPV Drone', dir: 'Dynamic FPV drone shot flying over scene' },
            { label: 'Macro 4K', dir: 'Macro close-up shot with shallow depth of field' },
            { label: 'Low Angle Hero', dir: 'Dramatic low-angle hero perspective with volumetric rim lighting' },
            { label: 'Anamorphic 21:9', dir: 'Cinematic anamorphic 35mm film grain with subtle horizontal lens flare' },
            { label: '360 Orbit', dir: 'Smooth 360-degree orbital rotation around character' },
            { label: 'Crane Down', dir: 'High-angle cinematic crane jib sweeping downward' },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => handleInsertDirective(p.dir)}
              className="px-2 py-0.5 rounded-md bg-[#161a22] hover:bg-[#202734] hover:text-white border border-[#232936] shrink-0 transition text-[10px]"
            >
              + {p.label}
            </button>
          ))}

          <span className="flex items-center gap-1 text-[#8c9bb0] font-semibold shrink-0 ml-2">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Light:</span>
          </span>
          {[
            { label: 'Golden Hour', dir: 'Warm golden hour sunset rim lighting, atmospheric dust motes' },
            { label: 'Neon Noir', dir: 'Moody cyberpunk neon reflections, wet asphalt, high contrast' },
            { label: 'Moody Fog', dir: 'Dense cinematic fog, silhouetted volumetric lighting' },
            { label: 'Studio Clean', dir: 'Commercial studio 3-point softbox lighting, clean reflections' },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => handleInsertDirective(p.dir)}
              className="px-2 py-0.5 rounded-md bg-[#161a22] hover:bg-[#202734] hover:text-white border border-[#232936] shrink-0 transition text-[10px]"
            >
              + {p.label}
            </button>
          ))}
        </div>

        {/* Bottom Controls Toolbar */}
        <div ref={popoverRef} className="relative flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-[#0f1114] border-t border-[#1e232c] select-none rounded-b-2xl">
          {/* Left Toolbar Options */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* [+] Button (Opens Media/Reference Drawer) */}
            <button 
              onClick={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
              title="Add References / Media"
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition ${
                isMediaDrawerOpen
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow-md'
                  : 'bg-[#181c22] hover:bg-[#222832] border-[#272e3a] text-[#8e98a8] hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Trigger @ Mention */}
            <button 
              onClick={() => {
                setPromptText(prev => {
                  const val = prev ? `${prev.trim()} @` : '@';
                  if (onPromptChange) onPromptChange(val);
                  return val;
                });
                setShowMentionMenu(true);
                setMentionQuery('');
                if (textareaRef.current) {
                  textareaRef.current.focus();
                }
              }}
              title="Mention Character / Prop"
              className="w-7 h-7 rounded-lg bg-[#181c22] hover:bg-[#222832] border border-[#272e3a] flex items-center justify-center text-[#8e98a8] hover:text-yellow-400 transition"
            >
              <AtSign className="w-3.5 h-3.5" />
            </button>

            {/* Model Selector Pill (Seedance 2.5) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c22] border border-[#272e3a] text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span>Seedance 2.5</span>
              <ChevronDown className="w-3 h-3 text-[#6f7a8b]" />
            </div>

            {/* REFERENCES Popover (References, Sequel, Prequel, Edit video) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'references' ? null : 'references')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                  referenceMode !== 'References'
                    ? 'bg-[#1f2531] border-yellow-400/50 text-yellow-300'
                    : 'bg-[#181c22] hover:bg-[#222832] border-[#272e3a] text-[#8e98a8] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
                <span>{referenceMode}</span>
                <ChevronDown className="w-3 h-3 text-[#6f7a8b]" />
              </button>

              {openDropdown === 'references' && (
                <div className="absolute left-0 bottom-9 z-50 w-52 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in">
                  {(['References', 'Sequel', 'Prequel', 'Edit video'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleSelectReferenceMode(m)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                        referenceMode === m ? 'bg-[#212836] text-white font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {m === 'References' && <Layers className="w-3.5 h-3.5 text-yellow-400" />}
                        {m === 'Sequel' && <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />}
                        {m === 'Prequel' && <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />}
                        {m === 'Edit video' && <Scissors className="w-3.5 h-3.5 text-purple-400" />}
                        <span>{m}</span>
                      </div>
                      {referenceMode === m && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ASPECT RATIO Popover */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'aspectRatio' ? null : 'aspectRatio')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c22] hover:bg-[#222832] border border-[#272e3a] text-xs font-mono font-medium text-[#c8d1dd] hover:text-white transition"
              >
                <span>{aspectRatio}</span>
              </button>

              {openDropdown === 'aspectRatio' && (
                <div className="absolute left-0 bottom-9 z-50 w-44 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1.5 text-xs grid grid-cols-2 gap-1 animate-in fade-in">
                  {[
                    { ratio: '16:9', desc: 'Cinema Widescreen' },
                    { ratio: '9:16', desc: 'Vertical Reel' },
                    { ratio: '21:9', desc: 'Anamorphic Ultrawide' },
                    { ratio: '4:3', desc: 'Vintage IMAX' },
                    { ratio: '1:1', desc: 'Square' },
                    { ratio: '3:4', desc: 'Portrait' },
                  ].map(item => (
                    <button
                      key={item.ratio}
                      onClick={() => {
                        setAspectRatio(item.ratio);
                        setOpenDropdown(null);
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg transition ${
                        aspectRatio === item.ratio ? 'bg-yellow-400 text-black font-black' : 'bg-[#1e2430] text-[#93a0b3] hover:text-white hover:bg-[#262e3d]'
                      }`}
                    >
                      <span className="font-mono text-xs">{item.ratio}</span>
                      <span className="text-[9px] opacity-75">{item.desc.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* QUALITY / RESOLUTION Popover */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'quality' ? null : 'quality')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c22] hover:bg-[#222832] border border-[#272e3a] text-xs font-medium text-white transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{resolution}</span>
              </button>

              {openDropdown === 'quality' && (
                <div className="absolute left-0 bottom-9 z-50 w-36 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in">
                  {(['1080p', '720p', '480p'] as const).map(res => (
                    <button
                      key={res}
                      onClick={() => {
                        setResolution(res);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                        resolution === res ? 'bg-[#212836] text-white font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <span>{res} {res === '1080p' ? '(Cinema HD)' : ''}</span>
                      {resolution === res && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DURATION Popover */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'duration' ? null : 'duration')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#181c22] hover:bg-[#222832] border border-[#272e3a] text-xs font-mono text-white transition"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{duration}</span>
              </button>

              {openDropdown === 'duration' && (
                <div className="absolute left-0 bottom-9 z-50 w-40 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in">
                  {['5s', '8s', '10s', '15s', '20s', '30s'].map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setDuration(d);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        duration === d ? 'bg-[#212836] text-white font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <span className="font-mono">{d}</span>
                      {duration === d && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BATCH STEPPER (- 1/4 +) */}
            <div className="flex items-center bg-[#181c22] border border-[#272e3a] rounded-lg px-1.5 py-0.5 text-xs text-white">
              <button 
                onClick={() => setBatchCount(Math.max(1, batchCount - 1))}
                className="p-1 hover:text-yellow-400 transition"
                title="Decrease batch"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-1.5 font-mono text-[11px] font-bold text-[#cbd3df]">
                {batchCount}/4
              </span>
              <button 
                onClick={() => setBatchCount(Math.min(4, batchCount + 1))}
                className="p-1 hover:text-yellow-400 transition"
                title="Increase batch"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* BITRATE Popover */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'bitrate' ? null : 'bitrate')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#181c22] hover:bg-[#222832] border border-[#272e3a] text-xs font-semibold text-yellow-300 transition"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span>{bitrate}</span>
              </button>

              {openDropdown === 'bitrate' && (
                <div className="absolute left-0 bottom-9 z-50 w-36 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in">
                  {(['High', 'Standard'] as const).map(br => (
                    <button
                      key={br}
                      onClick={() => {
                        setBitrate(br);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                        bitrate === br ? 'bg-[#212836] text-white font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <span>{br} Bitrate</span>
                      {bitrate === br && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SOUND Toggle Pill */}
            <button
              onClick={() => setSound(!sound)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                sound 
                  ? 'bg-[#1e2634] border-blue-400/40 text-blue-300' 
                  : 'bg-[#181c22] border-[#272e3a] text-[#717d8e] hover:text-white'
              }`}
              title="Seedance 2.5 Native AI Sound & Lip-sync Generation"
            >
              {sound ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-[#717d8e]" />}
              <span>{sound ? 'On' : 'Off'}</span>
            </button>

            {/* Hidden First Frame file input */}
            <input
              ref={firstFrameInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const formData = new FormData();
                  formData.append('file', file);
                  fetch('/api/upload', { method: 'POST', body: formData })
                    .then(r => r.json())
                    .then(d => {
                      if (d.success && d.url) setFirstFrameImage(d.url);
                    })
                    .catch(() => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) setFirstFrameImage(ev.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    });
                }
              }}
            />

            {/* CAMERA MOVEMENT Popover (30+ Director Presets) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'camera' ? null : 'camera')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                  cameraMovement !== 'Auto Camera'
                    ? 'bg-[#1f2531] border-yellow-400/50 text-yellow-300 font-semibold'
                    : 'bg-[#181c22] hover:bg-[#222832] border-[#272e3a] text-[#8e98a8] hover:text-white'
                }`}
                title="Director Camera Movement"
              >
                <Camera className="w-3.5 h-3.5 text-yellow-400" />
                <span className="max-w-[100px] truncate">{cameraMovement}</span>
                <ChevronDown className="w-3 h-3 text-[#6f7a8b]" />
              </button>

              {openDropdown === 'camera' && (
                <div className="absolute left-0 bottom-9 z-50 w-56 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1.5 text-xs text-[#cbd3de] animate-in fade-in max-h-72 overflow-y-auto no-scrollbar">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#6a7687] uppercase tracking-wider">30+ Director Movements</div>
                  {[
                    'Auto Camera',
                    'Static Tripod',
                    '360 Hero Orbit',
                    'Slow Zoom In',
                    'Fast Punch Zoom',
                    'Slow Zoom Out',
                    'Dolly In (Push In)',
                    'Dolly Out (Pull Out)',
                    'Pan Left',
                    'Pan Right',
                    'Tilt Up',
                    'Tilt Down',
                    'FPV Drone Chase',
                    'Crane Down Jib',
                    'Low Angle Hero',
                    'Handheld Shaky-cam',
                    'Whip Pan',
                    'Dutch Angle 15°'
                  ].map(move => (
                    <button
                      key={move}
                      type="button"
                      onClick={() => {
                        setCameraMovement(move);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        cameraMovement === move ? 'bg-[#212836] text-yellow-300 font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{move}</span>
                      {cameraMovement === move && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* OPTICAL LOOK Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'optical' ? null : 'optical')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                  opticalLook !== 'Default Neutral'
                    ? 'bg-[#1f2531] border-cyan-400/50 text-cyan-300 font-semibold'
                    : 'bg-[#181c22] hover:bg-[#222832] border-[#272e3a] text-[#8e98a8] hover:text-white'
                }`}
                title="Optics, Lighting & Film Tone"
              >
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[100px] truncate">{opticalLook}</span>
                <ChevronDown className="w-3 h-3 text-[#6f7a8b]" />
              </button>

              {openDropdown === 'optical' && (
                <div className="absolute left-0 bottom-9 z-50 w-56 bg-[#171b23] border border-[#273040] rounded-xl shadow-2xl p-1.5 text-xs text-[#cbd3de] animate-in fade-in max-h-72 overflow-y-auto no-scrollbar">
                  <div className="px-2 py-1 text-[10px] font-bold text-[#6a7687] uppercase tracking-wider">Film Looks & Optics</div>
                  {[
                    'Default Neutral',
                    'Anamorphic 2.39:1',
                    'Warm 35mm Halation',
                    '35mm Film Grain',
                    'Vintage 90s VHS',
                    'Cinematic Golden Hour',
                    'Moody Cyberpunk Neon',
                    'Gothic Film Noir',
                    'Clean Commercial Studio'
                  ].map(look => (
                    <button
                      key={look}
                      type="button"
                      onClick={() => {
                        setOpticalLook(look);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                        opticalLook === look ? 'bg-[#212836] text-cyan-300 font-bold' : 'hover:bg-[#1e2430] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{look}</span>
                      {opticalLook === look && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FIRST FRAME (Image-to-Video) Picker */}
            <button
              type="button"
              onClick={() => firstFrameInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                firstFrameImage 
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300 font-semibold' 
                  : 'bg-[#181c22] hover:bg-[#222832] border-[#272e3a] text-[#8e98a8] hover:text-white'
              }`}
              title="Set First Frame (Video starts from this keyframe photo)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{firstFrameImage ? 'Start Frame Set' : 'Start Frame'}</span>
            </button>
          </div>

          {/* Right Clean GENERATE Button with Live ModelArk Token Cost Estimation */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right font-mono text-[11px] leading-tight">
              <span suppressHydrationWarning className="text-yellow-400 font-bold flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400 fill-current" />
                {estimatedTokens.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} tokens
              </span>
              <span suppressHydrationWarning className="text-[9px] text-[#717d8e] font-sans">
                {resolution} • {duration} • 24fps DiT
              </span>
            </div>

            <button
              onClick={handleTriggerGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg ${
                isGenerating
                  ? 'bg-yellow-200 text-black/60 cursor-not-allowed'
                  : 'bg-[#e2fb42] hover:bg-[#d4ed37] text-black hover:scale-[1.02] active:scale-[0.98] shadow-yellow-400/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Seedance...</span>
                </>
              ) : (
                <span>GENERATE</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
