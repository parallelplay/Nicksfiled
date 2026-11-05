'use client';

import React, { useState } from 'react';
import { 
  Play, 
  SlidersHorizontal, 
  LayoutGrid, 
  Plus, 
  AtSign, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Layers, 
  ImageIcon, 
  Video as VideoIcon,
  Check,
  Eye,
  Film,
  Folder,
  FolderOpen,
  ArrowUpRight,
  ExternalLink,
  Filter,
  Scissors
} from 'lucide-react';
import { GeneratedAsset, ElementReference, Project } from '@/types';

interface MyGenerationsViewProps {
  allAssets: GeneratedAsset[];
  onSelectAsset: (asset: GeneratedAsset) => void;
  onGenerate: (prompt: string, selectedElements: ElementReference[], settings: any) => void;
  isGenerating: boolean;
  onOpenElements: () => void;
  globalElements: ElementReference[];
  projects?: Project[];
  onSelectProject?: (id: string) => void;
  onViewChange?: (view: 'home' | 'project' | 'generations') => void;
  onEditAsset?: (asset: GeneratedAsset) => void;
}

export default function MyGenerationsView({
  allAssets = [],
  onSelectAsset,
  onGenerate,
  isGenerating,
  onOpenElements,
  globalElements = [],
  projects = [],
  onSelectProject,
  onViewChange,
  onEditAsset,
}: MyGenerationsViewProps) {
  const [dockPrompt, setDockPrompt] = useState('');
  const [dockMode, setDockMode] = useState<'image' | 'video'>('video');
  const [viewMode, setViewMode] = useState<'grouped' | 'grid'>('grouped');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | '1080p' | '720p' | 'recent'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState('20s');
  const [resolution, setResolution] = useState('1080p');

  // Filter assets
  const filteredAssets = allAssets.filter(asset => {
    // Project filter
    if (selectedProjectFilter !== 'all') {
      if (asset.projectId !== selectedProjectFilter && asset.projectTitle !== selectedProjectFilter) {
        return false;
      }
    }

    // Resolution / Quality filter
    if (filterMode === '1080p') {
      return (asset.resolution || '').toLowerCase().includes('1080');
    }
    if (filterMode === '720p') {
      return (asset.resolution || '').toLowerCase().includes('720');
    }
    return true;
  });

  // Group assets by Project for the hierarchical Common view
  const projectGroups = React.useMemo(() => {
    const groups: {
      projectId: string;
      projectTitle: string;
      subfolderGroups: {
        folderPath: string;
        folderId?: string;
        assets: GeneratedAsset[];
      }[];
      totalCount: number;
    }[] = [];

    // Group all filtered assets by Project
    const projectMap = new Map<string, GeneratedAsset[]>();

    filteredAssets.forEach(asset => {
      const pId = asset.projectId || 'other-projects';
      if (!projectMap.has(pId)) {
        projectMap.set(pId, []);
      }
      projectMap.get(pId)!.push(asset);
    });

    // Also include any project from projects list that matches filter
    projects.forEach(p => {
      if (selectedProjectFilter === 'all' || selectedProjectFilter === p.id) {
        if (!projectMap.has(p.id)) {
          projectMap.set(p.id, []);
        }
      }
    });

    projectMap.forEach((assets, pId) => {
      const projObj = projects.find(p => p.id === pId);
      const projectTitle = projObj?.title || assets[0]?.projectTitle || (pId === 'other-projects' ? 'General Archive' : pId);

      // Subgroup by folderPath
      const folderMap = new Map<string, GeneratedAsset[]>();

      assets.forEach(asset => {
        const path = asset.folderPath || (asset.resolution?.includes('1080') ? 'Renders & Masters / 1080p Final Cuts' : 'Renders & Masters / 720p Fast Previews');
        if (!folderMap.has(path)) {
          folderMap.set(path, []);
        }
        folderMap.get(path)!.push(asset);
      });

      const subfolderGroups: { folderPath: string; folderId?: string; assets: GeneratedAsset[] }[] = [];
      folderMap.forEach((fAssets, folderPath) => {
        subfolderGroups.push({
          folderPath,
          folderId: fAssets[0]?.folderId,
          assets: fAssets,
        });
      });

      // Sort subfolders with 1080p / Renders first
      subfolderGroups.sort((a, b) => a.folderPath.localeCompare(b.folderPath));

      groups.push({
        projectId: pId,
        projectTitle,
        subfolderGroups,
        totalCount: assets.length,
      });
    });

    // Sort projects with assets first
    return groups.sort((a, b) => b.totalCount - a.totalCount);
  }, [filteredAssets, projects, selectedProjectFilter]);

  const handleDockGenerate = () => {
    if (!dockPrompt.trim()) return;

    onGenerate(dockPrompt, globalElements, {
      model: 'Seedance 2.5',
      aspectRatio,
      resolution,
      duration,
      bitrate: 'High',
      sound: true,
      batchCount: 1,
      referenceMode: 'References',
      referencesCount: globalElements.length,
    });

    setDockPrompt('');
  };

  const handleOpenProject = (projectId: string) => {
    if (onSelectProject && onViewChange) {
      onSelectProject(projectId);
      onViewChange('project');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0c0e] relative select-none">
      {/* Top Title Bar with View Mode & Project Filter */}
      <div className="border-b border-[#1b2029] bg-[#0c0e12]/90 backdrop-blur shrink-0 z-20">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Common Video Library</span>
              </h1>
              <span className="text-[10px] bg-yellow-400/10 text-yellow-300 font-mono px-2 py-0.5 rounded-full border border-yellow-400/20 font-bold">
                {allAssets.length} Total Videos
              </span>
            </div>
            <p className="text-[11px] text-[#717d8e] mt-0.5">
              Centralized archive preserving dedicated project folder & subfolder hierarchy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: Grouped vs Grid */}
            <div className="flex items-center bg-[#151921] border border-[#242c3b] rounded-xl p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'grouped'
                    ? 'bg-yellow-400 text-black font-bold shadow-sm'
                    : 'text-[#8da0b3] hover:text-white'
                }`}
                title="Organized by Project & Subfolder Hierarchy"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>By Project & Folder</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-yellow-400 text-black font-bold shadow-sm'
                    : 'text-[#8da0b3] hover:text-white'
                }`}
                title="Flat 4-Column Video Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Wall</span>
              </button>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181d25] hover:bg-[#202734] border border-[#273040] text-xs font-semibold text-[#cbd2dc] hover:text-white transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 top-10 z-50 w-48 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de]">
                  <button
                    onClick={() => { setFilterMode('all'); setShowFilterMenu(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left"
                  >
                    <span>All Resolutions</span>
                    {filterMode === 'all' && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                  </button>
                  <button
                    onClick={() => { setFilterMode('1080p'); setShowFilterMenu(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left"
                  >
                    <span>1080p Masters Only</span>
                    {filterMode === '1080p' && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                  </button>
                  <button
                    onClick={() => { setFilterMode('720p'); setShowFilterMenu(false); }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left"
                  >
                    <span>720p Previews Only</span>
                    {filterMode === '720p' && <Check className="w-3.5 h-3.5 text-yellow-400" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Filter Horizontal Pills */}
        <div className="flex items-center gap-1.5 px-6 pb-2.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748b] mr-1 shrink-0">
            Project:
          </span>
          <button
            onClick={() => setSelectedProjectFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
              selectedProjectFilter === 'all'
                ? 'bg-white/20 text-white border border-yellow-400/50'
                : 'bg-[#151921] text-[#7d8f9f] hover:text-white hover:bg-[#1d232f] border border-white/5'
            }`}
          >
            <span>All Projects</span>
            <span className="text-[10px] font-mono opacity-80">({allAssets.length})</span>
          </button>

          {projects.map(p => {
            const count = (p.assets || []).length;
            const isSelected = selectedProjectFilter === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectFilter(p.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-yellow-400 text-black font-bold shadow-sm'
                    : 'bg-[#151921] text-[#7d8f9f] hover:text-white hover:bg-[#1d232f] border border-white/5'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{p.title}</span>
                <span className="text-[10px] font-mono opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar pb-32">
        {allAssets.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 space-y-3">
            <Film className="w-12 h-12 text-[#465365] mx-auto" />
            <h3 className="text-sm font-bold text-white">No generated videos yet</h3>
            <p className="text-xs text-[#717d8e]">
              Enter a prompt in the dock below to generate your first video with ByteDance Seedance 2.5.
            </p>
          </div>
        ) : viewMode === 'grouped' ? (
          /* Grouped by Project & Subfolder Hierarchy View */
          <div className="space-y-8 max-w-7xl mx-auto">
            {projectGroups.map(projectGroup => {
              if (projectGroup.totalCount === 0 && selectedProjectFilter !== projectGroup.projectId) {
                return null;
              }

              return (
                <div 
                  key={projectGroup.projectId}
                  className="p-4 sm:p-5 rounded-2xl bg-[#101318] border border-[#212836] shadow-xl space-y-5"
                >
                  {/* Dedicated Main Project Folder Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#1c222d] flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 flex items-center justify-center shadow">
                        <Folder className="w-4 h-4 fill-yellow-400/20 text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-white tracking-tight">
                            {projectGroup.projectTitle}
                          </h2>
                          <span className="text-[10px] font-mono bg-yellow-400/10 text-yellow-300 font-bold px-2 py-0.2 rounded-full border border-yellow-400/20">
                            {projectGroup.totalCount} video{projectGroup.totalCount === 1 ? '' : 's'}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#717d8e] font-mono mt-0.5">
                          Dedicated Project Folder • {projectGroup.subfolderGroups.length} Subfolder Categories
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenProject(projectGroup.projectId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191f2a] hover:bg-[#232b3b] border border-[#2d374a] text-xs font-semibold text-yellow-300 hover:text-white transition shadow-sm"
                    >
                      <span>Open Project Workspace</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Subfolders & Video Grids */}
                  {projectGroup.subfolderGroups.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#64748b]">
                      No video shots in this project yet.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {projectGroup.subfolderGroups.map((subgroup, sIdx) => (
                        <div key={sIdx} className="space-y-3">
                          {/* Subfolder Header Pill */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-[#94a3b8]">
                              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-semibold text-white font-mono text-[11px]">
                                {subgroup.folderPath}
                              </span>
                              <span className="text-[10px] text-[#64748b] font-mono bg-black/40 px-1.5 py-0.2 rounded">
                                {subgroup.assets.length}
                              </span>
                            </div>
                          </div>

                          {/* Video Cards Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            {subgroup.assets.map(asset => (
                              <VideoCard 
                                key={asset.id} 
                                asset={asset} 
                                onSelectAsset={onSelectAsset} 
                                onEditAsset={onEditAsset}
                                projectTitle={projectGroup.projectTitle}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Grid Wall View with Project & Folder Pills */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-7xl mx-auto">
            {filteredAssets.map(asset => (
              <VideoCard 
                key={asset.id} 
                asset={asset} 
                onSelectAsset={onSelectAsset} 
                onEditAsset={onEditAsset}
                projectTitle={asset.projectTitle || 'Project'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Prompt Dock Bar */}
      <div className="absolute bottom-5 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto flex items-center gap-2 bg-[#12151b]/95 backdrop-blur-xl border border-[#232a38] rounded-2xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.8)]">
          {/* Left Mode Pill: Image / Video */}
          <div className="flex flex-col bg-[#1a1f28] border border-[#27303e] rounded-xl p-0.5 shrink-0 text-[10px] font-bold">
            <button
              onClick={() => setDockMode('image')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                dockMode === 'image' ? 'bg-[#273040] text-white shadow-sm' : 'text-[#727e90] hover:text-white'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Image</span>
            </button>
            <button
              onClick={() => setDockMode('video')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                dockMode === 'video' ? 'bg-[#273040] text-white shadow-sm' : 'text-[#727e90] hover:text-white'
              }`}
            >
              <VideoIcon className="w-3 h-3 text-yellow-400" />
              <span>Video</span>
            </button>
          </div>

          {/* Center Input & Inline Controls */}
          <div className="flex-1 flex flex-col justify-between px-2 gap-1.5 min-w-0">
            <input
              type="text"
              value={dockPrompt}
              onChange={(e) => setDockPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDockGenerate();
              }}
              placeholder="Describe the video you want to create in Common Library..."
              className="w-full bg-transparent text-white text-xs placeholder-[#566375] focus:outline-none truncate"
            />

            {/* Inline Quick Controls Row */}
            <div className="flex items-center gap-2 text-[11px] text-[#818ea1] overflow-x-auto no-scrollbar">
              <button 
                onClick={onOpenElements} 
                className="hover:text-white transition shrink-0" 
                title="Add references"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={() => setDockPrompt(p => p + ' @')} 
                className="hover:text-yellow-400 transition shrink-0" 
                title="Mention element"
              >
                <AtSign className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-[1px] bg-[#242b38] shrink-0" />

              {/* Seedance 2.5 with Equalizer Icon */}
              <div className="flex items-center gap-1 text-white font-semibold shrink-0">
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                  <span className="w-0.5 h-3 bg-emerald-400 animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse" />
                </div>
                <span>Seedance 2.5</span>
              </div>

              {/* References */}
              <button 
                onClick={onOpenElements}
                className="flex items-center gap-1 hover:text-white transition shrink-0"
              >
                <Layers className="w-3 h-3 text-yellow-400" />
                <span>References</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#647182]" />
              </button>

              {/* 9:16 Aspect Ratio */}
              <span className="font-mono bg-[#181d26] px-1.5 py-0.5 rounded text-[10px] text-white shrink-0">
                {aspectRatio}
              </span>

              {/* 1080p */}
              <span className="flex items-center gap-0.5 text-cyan-300 shrink-0">
                <Sparkles className="w-2.5 h-2.5" /> {resolution}
              </span>

              {/* 20s */}
              <span className="flex items-center gap-0.5 font-mono text-amber-300 shrink-0">
                <Clock className="w-2.5 h-2.5" /> {duration}
              </span>
            </div>
          </div>

          {/* Right Clean Yellow GENERATE Button */}
          <button
            onClick={handleDockGenerate}
            disabled={isGenerating}
            className="px-5 py-3 rounded-xl bg-[#e2fb42] hover:bg-[#d0ea35] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shrink-0 active:scale-95"
          >
            {isGenerating ? 'RENDERING...' : 'GENERATE'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean reusable video card component displaying project and subfolder hierarchy tags
 */
function VideoCard({ 
  asset, 
  onSelectAsset, 
  onEditAsset,
  projectTitle 
}: { 
  asset: GeneratedAsset; 
  onSelectAsset: (a: GeneratedAsset) => void;
  onEditAsset?: (a: GeneratedAsset) => void;
  projectTitle?: string;
}) {
  return (
    <div
      onClick={() => onSelectAsset(asset)}
      className="group relative rounded-2xl overflow-hidden bg-[#141820] border border-[#222834] hover:border-yellow-400/80 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between aspect-[9/16]"
    >
      {/* Video Preview on Hover / Thumbnail Poster */}
      {asset.videoUrl ? (
        <video
          src={asset.videoUrl}
          poster={asset.thumbnail}
          muted
          loop
          playsInline
          preload="metadata"
          onMouseEnter={(e) => {
            try { e.currentTarget.play(); } catch (err) {}
          }}
          onMouseLeave={(e) => {
            try { 
              e.currentTarget.pause(); 
              e.currentTarget.currentTime = 0; 
            } catch (err) {}
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <img
          src={asset.thumbnail}
          alt={asset.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      {/* Vignette gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 group-hover:from-black/95 transition-all" />

      {/* Top Project & Folder Hierarchy Badges */}
      <div className="relative z-10 p-2.5 flex items-start justify-between flex-wrap gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-yellow-300 px-2 py-0.5 rounded border border-yellow-400/20 flex items-center gap-1 shadow-sm max-w-[120px] truncate">
          <Folder className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
          <span className="truncate">{projectTitle || asset.projectTitle || 'Project'}</span>
        </span>

        <div className="flex items-center gap-1">
          {onEditAsset && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditAsset(asset);
              }}
              className="text-[9px] font-semibold bg-blue-500/25 hover:bg-blue-500/40 text-blue-300 border border-blue-400/40 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition shadow"
              title="Edit in Video Editor"
            >
              <Scissors className="w-2.5 h-2.5" />
              <span>Edit</span>
            </button>
          )}
          <span className="text-[9px] font-mono font-semibold bg-black/80 backdrop-blur-md text-white px-1.5 py-0.5 rounded border border-white/10">
            {asset.duration}
          </span>
        </div>
      </div>

      {/* Center Big Play Icon on Hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-11 h-11 rounded-full bg-yellow-400 text-black flex items-center justify-center transform scale-90 group-hover:scale-100 transition shadow-2xl">
          <Play className="w-5 h-5 fill-black ml-0.5" />
        </div>
      </div>

      {/* Bottom Video Meta & Folder Breadcrumb */}
      <div className="relative z-10 p-3 space-y-1 transform translate-y-1 group-hover:translate-y-0 transition-transform">
        <div className="font-bold text-xs text-white truncate drop-shadow">
          {asset.title}
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#cbd3de]">
          <span className="font-mono text-cyan-300 truncate max-w-[110px]" title={asset.folderPath || asset.folderId}>
            📁 {asset.folderPath || asset.folderId || '1080p Final Cuts'}
          </span>
          <span className="font-semibold text-yellow-300 shrink-0">{asset.resolution || '1080p'}</span>
        </div>
      </div>
    </div>
  );
}
