'use client';

import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  User, 
  Package, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  Check, 
  AtSign, 
  Layers, 
  ChevronDown, 
  Info,
  Folder,
  Globe,
  Link,
  Sparkles
} from 'lucide-react';
import { ElementReference, ElementCategory } from '@/types';

interface ElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: ElementReference[];
  onAddElement: (newElement: ElementReference) => void;
  onDeleteElement: (id: string) => void;
  onSelectElementToPrompt?: (tag: string) => void;
  title?: string;
  allowImportGlobal?: boolean;
  allGlobalElements?: ElementReference[];
  onLinkGlobalElement?: (element: ElementReference) => void;
}

export default function ElementsModal({
  isOpen,
  onClose,
  elements,
  onAddElement,
  onDeleteElement,
  onSelectElementToPrompt,
  title = 'Elements',
  allowImportGlobal = false,
  allGlobalElements = [],
  onLinkGlobalElement,
}: ElementsModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | ElementCategory | 'global'>('all');
  const [isCreating, setIsCreating] = useState(false);

  // Form State matching Screenshot (media_1790626668717.png)
  const [category, setCategory] = useState<'Auto' | 'Character' | 'Prop' | 'Location'>('Auto');
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1');
  const [elementId, setElementId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('No status');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [customProps, setCustomProps] = useState<Array<{ key: string; value: string }>>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    let chosenCat: 'Auto' | 'Character' | 'Prop' | 'Location' = 'Auto';
    if (activeTab === 'character') chosenCat = 'Character';
    else if (activeTab === 'prop') chosenCat = 'Prop';
    else if (activeTab === 'location') chosenCat = 'Location';
    setCategory(chosenCat);

    // Exact Higgsfield AI sequential convention: @img01, @char01, @prop01, @loc01
    const count = elements.length + 1;
    const numStr = String(count).padStart(2, '0');
    if (chosenCat === 'Character') {
      setName(`Character ${numStr}`);
      setElementId(`char${numStr}`);
    } else if (chosenCat === 'Prop') {
      setName(`Prop ${numStr}`);
      setElementId(`prop${numStr}`);
    } else if (chosenCat === 'Location') {
      setName(`Location ${numStr}`);
      setElementId(`loc${numStr}`);
    } else {
      setName(`Image ${numStr}`);
      setElementId(`img${numStr}`);
    }

    setIsCreating(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const prefix = category === 'Character' ? 'char' : category === 'Prop' ? 'prop' : category === 'Location' ? 'loc' : 'img';
    setElementId(clean ? `${prefix}_${clean}` : `${prefix}01`);
  };

  const handleCategoryChange = (newCat: 'Auto' | 'Character' | 'Prop' | 'Location') => {
    setCategory(newCat);
    const count = elements.length + 1;
    const numStr = String(count).padStart(2, '0');
    const prefix = newCat === 'Character' ? 'char' : newCat === 'Prop' ? 'prop' : newCat === 'Location' ? 'loc' : 'img';
    const defaultLabel = newCat === 'Character' ? 'Character' : newCat === 'Prop' ? 'Prop' : newCat === 'Location' ? 'Location' : 'Image';
    if (!name.trim() || /^(Image|Character|Prop|Location|Custom)\s*\d*$/i.test(name)) {
      setName(`${defaultLabel} ${numStr}`);
      setElementId(`${prefix}${numStr}`);
    } else {
      const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      setElementId(`${prefix}_${clean}`);
    }
  };

  const resizeImageFile = (file: File, maxDim: number = 2048): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width <= maxDim && height <= maxDim) {
            resolve(dataUrl);
            return;
          }
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } else {
            resolve(dataUrl);
          }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) return data.url;
      }
    } catch (e) {
      console.warn('Upload API failed, falling back to data URL:', e);
    }
    return resizeImageFile(file, 2048);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const optimizedUrl = await uploadImageFile(file);
      if (optimizedUrl) {
        setUploadedImages(prev => [...prev, optimizedUrl]);
        // Exact Higgsfield convention: default to Image 01 / img01 or Character 01 / char01
        if (!name.trim() || /^(Image|Character|Prop|Location|Custom)\s*\d*$/i.test(name)) {
          const count = elements.length + 1 + idx;
          const numStr = String(count).padStart(2, '0');
          const prefix = category === 'Character' ? 'char' : category === 'Prop' ? 'prop' : category === 'Location' ? 'loc' : 'img';
          const defaultLabel = category === 'Character' ? 'Character' : category === 'Prop' ? 'Prop' : category === 'Location' ? 'Location' : 'Image';
          setName(`${defaultLabel} ${numStr}`);
          setElementId(`${prefix}${numStr}`);
        }
      }
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setUploadedImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let resolvedCat: ElementCategory = 'character';
    if (category === 'Prop') resolvedCat = 'prop';
    else if (category === 'Location') resolvedCat = 'location';
    else if (category === 'Auto') {
      const lower = name.toLowerCase();
      if (lower.includes('glasses') || lower.includes('car') || lower.includes('watch') || lower.includes('gun') || lower.includes('specs') || lower.includes('prop')) {
        resolvedCat = 'prop';
      } else if (lower.includes('street') || lower.includes('room') || lower.includes('city') || lower.includes('campsite') || lower.includes('forest') || lower.includes('location')) {
        resolvedCat = 'location';
      } else {
        resolvedCat = 'character';
      }
    }

    const tag = elementId.startsWith('@') ? elementId : `@${elementId || name.toLowerCase().replace(/\s+/g, '_')}`;
    const defaultThumbnail = uploadedImages[0] || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80';

    const newElem: ElementReference = {
      id: `elem-${Date.now()}`,
      name: name.trim(),
      tag,
      category: resolvedCat,
      thumbnail: defaultThumbnail,
      description: description.trim(),
      referenceImages: uploadedImages.length > 0 ? uploadedImages : [defaultThumbnail],
    };

    onAddElement(newElem);
    setIsCreating(false);
    // Reset form
    setName('');
    setElementId('');
    setDescription('');
    setVersion('v1');
    setStatus('No status');
    setUploadedImages([]);
    setCustomProps([]);
  };

  const currentElements = activeTab === 'global' ? allGlobalElements : elements;
  const filtered = activeTab === 'all' || activeTab === 'global' 
    ? currentElements 
    : currentElements.filter(e => e.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div 
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            setIsCreating(true);
            handleFiles(e.dataTransfer.files);
          }
        }}
        className="w-full max-w-4xl bg-[#14171c] border border-[#262c37] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        
        {isCreating ? (
          /* EXACT HIGGSFIELD "New element" MODAL (Screenshot media_1790626668717.png) */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Modal Title Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#212732] bg-[#161a22]">
              <h2 className="text-base font-bold text-white">New element</h2>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-[#6d7989] hover:text-white p-1 rounded-full hover:bg-[#202633] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2-Column Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Left Column: Huge Drag & Drop Area */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#212732] min-h-[340px]">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFiles(e.dataTransfer.files);
                  }}
                  className="w-full max-w-md h-64 rounded-2xl border-2 border-dashed border-[#293241] hover:border-yellow-400/60 bg-[#101318] flex flex-col items-center justify-center text-center p-6 cursor-pointer transition group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#1b2029] group-hover:bg-[#262e3d] flex items-center justify-center mb-3 transition shadow-inner">
                    <UploadCloud className="w-7 h-7 text-[#8390a2] group-hover:text-yellow-400 transition" />
                  </div>
                  <p className="text-xs font-semibold text-[#8b97a8] group-hover:text-white transition">
                    Drop image or video here to add to element
                  </p>
                  <span className="text-[11px] text-[#556070] mt-1">or click to browse files</span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {/* Direct Image URL input option */}
                <div className="w-full max-w-md mt-3 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Or paste reference image URL (https://...)"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddImageUrl();
                      }
                    }}
                    className="flex-1 bg-[#101318] border border-[#232935] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#505c6d] focus:outline-none focus:border-yellow-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 rounded-xl bg-[#202633] hover:bg-[#2b3343] text-xs font-semibold text-[#a5b2c3] hover:text-white transition"
                  >
                    Add
                  </button>
                </div>

                {/* Uploaded Photos Previews */}
                {uploadedImages.length > 0 && (
                  <div className="w-full max-w-md mt-3 flex items-center gap-2 overflow-x-auto p-2 bg-[#0e1115] rounded-xl border border-[#222833]">
                    {uploadedImages.map((img, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img src={img} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-[#2c3546]" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Properties Sidebar */}
              <div className="w-full md:w-80 p-5 space-y-3.5 bg-[#12151b] overflow-y-auto no-scrollbar text-xs">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#8390a2] mb-1">Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => handleCategoryChange(e.target.value as any)}
                      className="w-full bg-[#181c24] border border-[#293241] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 appearance-none font-medium"
                    >
                      <option value="Auto">📁 Auto (Smart Detect)</option>
                      <option value="Character">👤 Character (Face & Identity Lock)</option>
                      <option value="Location">🏕️ Location (Architecture & Set Lock)</option>
                      <option value="Prop">🕶️ Prop (Object & Texture Lock)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6c7889] absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#8390a2] mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter element name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-[#181c24] border border-[#293241] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                  <p className="text-[10px] text-[#556172] mt-1">The display name, e.g. Cal, Oli, Elena</p>
                </div>

                {/* Version */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8390a2] mb-1">
                    <span>Version</span>
                    <Info className="w-3 h-3 text-[#556172]" />
                  </div>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. v1"
                    className="w-full bg-[#181c24] border border-[#293241] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Element ID */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8390a2] mb-1">
                    <span>Element ID</span>
                    <Info className="w-3 h-3 text-[#556172]" />
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-yellow-400 font-bold font-mono">@</span>
                    <input
                      type="text"
                      value={elementId.replace(/^@/, '')}
                      onChange={(e) => setElementId(`@${e.target.value}`)}
                      placeholder="e.g. char_oli_v1"
                      className="w-full bg-[#181c24] border border-[#293241] rounded-xl pl-7 pr-3 py-2 text-xs text-yellow-300 font-mono focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#8390a2] mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this element (optional)"
                    className="w-full bg-[#181c24] border border-[#293241] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-yellow-400 resize-none"
                  />
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-[#8390a2] mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-[#181c24] border border-[#293241] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 appearance-none font-medium"
                    >
                      <option value="No status">◌ No status</option>
                      <option value="Ready">● Ready</option>
                      <option value="In Progress">◐ In Progress</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#6c7889] absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Custom Properties */}
                <div className="pt-1">
                  <div className="text-[10px] font-bold text-[#627082] uppercase tracking-wider mb-1.5">
                    Custom Properties
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const k = prompt('Property Name (e.g. Outfit, Eye Color):');
                      if (k) {
                        const v = prompt(`Value for ${k}:`);
                        if (v) setCustomProps(prev => [...prev, { key: k, value: v }]);
                      }
                    }}
                    className="text-xs text-[#8e9caf] hover:text-white flex items-center gap-1.5 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add custom property</span>
                  </button>

                  {customProps.map((cp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-[#cbd3de] bg-[#1a202a] px-2 py-1 rounded-md mt-1">
                      <span className="font-semibold text-[#93a1b5]">{cp.key}:</span>
                      <span>{cp.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Bottom Modal Footer (Cancel & Create Buttons) */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-3 border-t border-[#212732] bg-[#12151b]">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl bg-[#202632] hover:bg-[#2b3343] text-xs font-semibold text-[#a5b2c3] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black text-xs font-black uppercase tracking-wider transition shadow-md"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          /* Elements Library List View */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#212732] bg-[#161a22]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {title}
                    <span className="text-xs bg-[#242c3b] text-yellow-300 font-semibold px-2 py-0.5 rounded-full">
                      {activeTab === 'global' ? allGlobalElements.length : elements.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[#7e8999]">
                    Mention any element with <span className="text-yellow-400 font-mono">@tag</span> in prompts for consistent characters and props.
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#6c7786] hover:text-white p-1 rounded-lg hover:bg-[#202632] transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub Nav & Filter Tabs (Strict Category Order: All -> Characters -> Locations -> Props) */}
            <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#1c212a] bg-[#0e1115] overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { id: 'all', label: 'All', count: elements.length },
                  { id: 'character', label: 'Characters', count: elements.filter(e => e.category === 'character').length },
                  { id: 'location', label: 'Locations', count: elements.filter(e => e.category === 'location').length },
                  { id: 'prop', label: 'Props', count: elements.filter(e => e.category === 'prop').length },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                      activeTab === tab.id ? 'bg-[#222936] text-white shadow-sm font-bold border border-white/10' : 'text-[#7d8898] hover:text-white'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black font-bold text-xs shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New element</span>
                </button>
              </div>
            </div>

            {/* Elements Cards Grid */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {filtered.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#181d26] border border-[#262f3f] flex items-center justify-center text-[#788596] mb-3">
                    <AtSign className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    {activeTab === 'global' ? 'Global library is empty' : 'No elements in this project yet'}
                  </h4>
                  <p className="text-xs text-[#717d8e] max-w-sm mb-4">
                    {activeTab === 'global' 
                      ? 'Create elements to lock characters and props across all your projects.' 
                      : 'Every project starts clean. Create a new element or import one from your Global Library.'}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenCreate}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black font-bold text-xs shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Element</span>
                    </button>
                    {allowImportGlobal && allGlobalElements.length > 0 && activeTab !== 'global' && (
                      <button
                        onClick={() => setActiveTab('global')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1c222e] hover:bg-[#252d3d] border border-[#2b3445] text-white font-semibold text-xs transition"
                      >
                        <Globe className="w-3.5 h-3.5 text-blue-400" />
                        <span>Browse Global Library</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map(elem => {
                    const isAlreadyInProject = elements.some(e => e.id === elem.id);

                    return (
                      <div
                        key={elem.id}
                        className="bg-[#151920] border border-[#222833] hover:border-[#384355] rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                              {elem.tag}
                            </span>
                            <span className="text-[10px] text-[#717c8d] uppercase font-bold tracking-wider">
                              {elem.category}
                            </span>
                          </div>

                          <div className="flex gap-3 mb-2.5">
                            <img
                              src={elem.thumbnail}
                              alt={elem.name}
                              className="w-16 h-16 rounded-xl object-cover border border-[#2d3646] shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{elem.name}</h4>
                              <p className="text-[11px] text-[#7e8999] line-clamp-2 leading-relaxed mt-0.5">
                                {elem.description || 'No description provided.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#647182] font-medium mb-3">
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            <span>{elem.referenceImages.length} Reference Angles Linked</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#1e232d]">
                          {activeTab === 'global' ? (
                            isAlreadyInProject ? (
                              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Added to Project
                              </span>
                            ) : (
                              <button
                                onClick={() => onLinkGlobalElement && onLinkGlobalElement(elem)}
                                className="text-xs text-yellow-300 hover:text-yellow-200 font-semibold flex items-center gap-1 hover:underline"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add to this project
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() => onSelectElementToPrompt && onSelectElementToPrompt(elem.tag)}
                              className="text-xs text-yellow-300 hover:text-yellow-200 font-semibold flex items-center gap-1 hover:underline"
                            >
                              <AtSign className="w-3 h-3" /> Insert in Prompt
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteElement(elem.id)}
                            className="text-[#647182] hover:text-red-400 p-1 rounded transition"
                            title="Delete Element"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
