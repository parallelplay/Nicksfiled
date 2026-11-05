'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Film, 
  ChevronDown, 
  Home, 
  Sparkles, 
  AtSign, 
  Heart, 
  Globe, 
  GraduationCap, 
  Plus, 
  Search, 
  ArrowUpDown, 
  FileText, 
  Settings, 
  Palette, 
  MessageSquare, 
  Clapperboard, 
  Folder, 
  MoreVertical, 
  ChevronLeft, 
  Lock, 
  ExternalLink, 
  Pin, 
  Edit2, 
  Copy, 
  Link2, 
  Trash2, 
  Rocket, 
  ChevronRight, 
  X,
  Check,
  Play,
  Layers,
  Scissors
} from 'lucide-react';
import { Project, ProjectFolder, DirectChat } from '@/types';

interface SidebarProps {
  currentProject: Project;
  projects: Project[];
  activeView: 'home' | 'project' | 'generations';
  onViewChange: (view: 'home' | 'project' | 'generations') => void;
  onOpenElements: () => void;
  onOpenBrief: () => void;
  onOpenSettings: () => void;
  selectedTool: 'canvas' | 'chat' | 'director' | 'editor';
  onSelectTool: (tool: 'canvas' | 'chat' | 'director' | 'editor') => void;
  selectedFolderId: string;
  onSelectFolder: (id: string) => void;
  onNewProject: () => void;
  onSelectProject: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  onRenameProject?: (id: string, newTitle: string) => void;
  onAddFolder?: (name: string, parentId?: string | null) => void;
  onDeleteFolder?: (id: string) => void;
  totalGlobalElementsCount?: number;
  chats?: DirectChat[];
  activeChatId?: string | null;
  onSelectChat?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  tokenBalance?: number;
  onOpenTokenManager?: () => void;
}

export default function Sidebar({
  currentProject,
  projects = [],
  activeView,
  onViewChange,
  onOpenElements,
  onOpenBrief,
  onOpenSettings,
  selectedTool,
  onSelectTool,
  selectedFolderId,
  onSelectFolder,
  onNewProject,
  onSelectProject,
  onDeleteProject,
  onRenameProject,
  onAddFolder,
  onDeleteFolder,
  totalGlobalElementsCount = 0,
  chats = [],
  activeChatId = null,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  tokenBalance = 5000000,
  onOpenTokenManager,
}: SidebarProps) {
  // Folder, Project & Chat Context Menus
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null);
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);
  const [pinnedFolderIds, setPinnedFolderIds] = useState<string[]>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>(['renders', 'scenes', 'drafts']);
  const [folderColors, setFolderColors] = useState<Record<string, string>>({
    'getting-started': '#38bdf8',
  });
  const [showColorPickerFor, setShowColorPickerFor] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchProjectQuery, setSearchProjectQuery] = useState('');
  const [showProjectSearch, setShowProjectSearch] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortOption, setSortOption] = useState<'First created' | 'Last created' | 'Last changed' | 'Name A-Z' | 'Name Z-A'>('Last changed');
  const [showPromoCard, setShowPromoCard] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuFolderId(null);
        setActiveMenuProjectId(null);
        setActiveMenuChatId(null);
        setShowColorPickerFor(null);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTogglePin = (id: string) => {
    setPinnedFolderIds(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
    setActiveMenuFolderId(null);
    showToast('Folder pin status updated');
  };

  const handleCopyLink = (folder: ProjectFolder) => {
    navigator.clipboard?.writeText(window.location.origin + `/generate?folder=${folder.id}`);
    setActiveMenuFolderId(null);
    showToast('Link copied to clipboard!');
  };

  const handleEditFolder = (folder: ProjectFolder) => {
    const newName = prompt('Rename folder:', folder.name);
    if (newName && newName.trim()) {
      folder.name = newName.trim();
      showToast(`Renamed to "${newName}"`);
    }
    setActiveMenuFolderId(null);
  };

  const handleSetFolderColor = (folderId: string, color: string) => {
    setFolderColors(prev => ({ ...prev, [folderId]: color }));
    setShowColorPickerFor(null);
    setActiveMenuFolderId(null);
    showToast('Folder color updated');
  };

  const filteredProjects = projects
    .filter(p => p.title.toLowerCase().includes(searchProjectQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'Name A-Z') return a.title.localeCompare(b.title);
      if (sortOption === 'Name Z-A') return b.title.localeCompare(a.title);
      return 0;
    });

  const isHomeOrGenerations = activeView === 'home' || activeView === 'generations';

  return (
    <aside className="w-[231px] shrink-0 bg-[#0F1113] border-r border-white/5 flex flex-col justify-between h-[calc(100vh-46px)] select-none text-xs relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-4 right-4 z-50 bg-[#1e2531] border border-yellow-400/40 text-yellow-300 text-[11px] font-semibold py-1.5 px-3 rounded-xl shadow-xl text-center animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Space Switcher (Exact Higgsfield HTML: Cinema Studio pill with #D1FE17 Logo) */}
      <div className="flex flex-col border-b border-white/5 px-2 py-2">
        <div className="flex items-center justify-between gap-1">
          <div 
            onClick={() => onViewChange('home')}
            className="flex h-9 flex-1 items-center justify-between gap-1.5 rounded-xl bg-white/[0.05] pl-2.5 pr-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:bg-white/[0.1] cursor-pointer transition"
          >
            <div className="flex min-w-0 items-center gap-2">
              {/* Exact Higgsfield Official Brand Logo */}
              <div className="size-6 shrink-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="4 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6 shrink-0">
                  <path fill="#D1FE17" d="M4 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" />
                  <path fill="#1A1A1A" d="m26.02 11.805-.02-.216c-.18-2.068-1.484-5.958-5.102-5.958-2.685 0-4.713 2.734-6.502 5.145-1.428 1.93-2.666 3.586-4.027 3.586-.362-.04-.828-.225-1.114-.647-.257-.382-.324-.872-.19-1.46.209-.93 1.409-1.793 2.675-2.714.694-.49 1.409-1.01 1.904-1.51 1.428-1.42 2.151-2.449 2.151-4.105s-.885-2.48-1.628-2.832C12.682.389 10.502.8 9.112 2.035c-.209.196-.419.382-.61.558C7.104 3.877 6.163 4.75 4 4.083v2.685c2.865 1.303 5.274-1.186 6.188-2.332.704-.755 1.447-1.196 2-1.196h.028c.248.01.457.108.61.284.247.294.342.637.294 1.02-.104.803-.913 1.744-2.399 2.773-1.742 1.205-4.655 3.223-4.884 5.762-.17 1.822.743 3.645 2.171 4.35 3.332 1.627 5.36-1.176 7.511-4.135 1.647-2.283 3.208-4.449 5.38-4.449 1.95 0 2.674 1.666 2.674 2.715v.205l-.19.04c-4.732.862-7.312 5.428-7.312 7.535s1.733 3.91 3.865 3.91c2.495 0 5.58-2.195 6.074-8.368l.02-.226H28v-2.851zm-2.58 3.165c-.38 3.694-2.218 5.418-3.332 5.418-.505 0-1.21-.43-1.21-1.234 0-.902 1.305-3.636 4.237-4.449l.343-.088z" />
                </svg>
              </div>
              <span className="truncate text-sm font-semibold text-white/90">Cinema Studio</span>
            </div>
            <svg className="size-2.5 text-white/50" viewBox="0 0 6 10">
              <path d="M5.85 0.8L3 3.23L0.14 0.8" fill="currentColor"/>
              <path d="M0.14 9.2L3 6.77L5.85 9.2" fill="currentColor"/>
            </svg>
          </div>

          <button 
            type="button"
            aria-label="Collapse sidebar"
            onClick={() => onViewChange(activeView === 'home' ? 'project' : 'home')}
            className="size-9 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Collapse sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="size-4">
              <path d="M1.83333 3.83333C1.83333 3.46514 2.13181 3.16667 2.5 3.16667H13.5C13.8682 3.16667 14.1667 3.46515 14.1667 3.83333V12.1667C14.1667 12.5349 13.8682 12.8333 13.5 12.8333H2.5C2.13181 12.8333 1.83333 12.5349 1.83333 12.1667V3.83333Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M4.16667 5.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Navigation Scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 no-scrollbar">
        {isHomeOrGenerations ? (
          /* General Home / Generations Navigation (Exact Higgsfield SSR Gradients) */
          <div className="space-y-0.5">
            {/* 1. Home */}
            <button 
              onClick={() => onViewChange('home')}
              className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition text-left group ${
                activeView === 'home' 
                  ? 'bg-white/10 text-white font-medium shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(135deg,#222221_3.87%,#3B3C3A_93.45%)] border border-white/15">
                <Home className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-xs font-medium text-white">Home</span>
            </button>

            {/* 2. Common Central Library (All Generations) */}
            <button 
              onClick={() => onViewChange('generations')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition text-left group ${
                activeView === 'generations' 
                  ? 'bg-white/10 text-white font-medium shadow-sm' 
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(135deg,#51E2E0_3.87%,#125C8D_93.45%)] border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-xs font-medium text-white truncate">Common Library</span>
              </div>
              <span className="text-[9px] bg-yellow-400/10 text-yellow-300 font-mono px-1.5 py-0.2 rounded border border-yellow-400/20 font-semibold shrink-0">
                All Projects
              </span>
            </button>

            {/* 3. My elements */}
            <button 
              onClick={onOpenElements}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition text-left group"
            >
              <div className="flex items-center gap-2.5">
                <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(135deg,#4188BE_3.87%,#0E2772_93.45%)] border border-white/15">
                  <AtSign className="w-3.5 h-3.5 text-white" />
                </span>
                <span className="text-xs font-medium text-white">My elements</span>
              </div>
              <span className="text-[10px] bg-white/10 text-cyan-200 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {totalGlobalElementsCount}
              </span>
            </button>

            {/* 4. My favorites */}
            <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition text-left group">
              <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(135deg,#E251B4_3.87%,#8D1237_93.45%)] border border-white/15">
                <Heart className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-xs font-medium text-white">My favorites</span>
            </button>

            {/* 5. Community */}
            <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition text-left group">
              <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(135deg,#A5A5A5_3.87%,#3D3D3D_93.45%)] border border-white/15">
                <Globe className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-xs font-medium text-white">Community</span>
            </button>

            {/* 6. Academy */}
            <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition text-left group">
              <span className="relative size-6 shrink-0 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-[linear-gradient(-45deg,#0E3A15_0%,#2EB844_100%)] border border-white/15">
                <GraduationCap className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="text-xs font-medium text-white">Academy</span>
            </button>

            {/* Projects Section */}
            <div className="pt-3">
              <div className="flex items-center justify-between px-1.5 pb-1 text-[11px] font-semibold text-white/50">
                <span>Projects ({projects.length})</span>
                <div className="flex items-center gap-1">
                  <Search 
                    onClick={() => setShowProjectSearch(!showProjectSearch)}
                    className="w-3.5 h-3.5 hover:text-white cursor-pointer" 
                  />
                  <div className="relative" ref={sortRef}>
                    <ArrowUpDown 
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="w-3.5 h-3.5 hover:text-white cursor-pointer" 
                    />
                    {showSortMenu && (
                      <div className="absolute right-0 top-6 z-50 w-36 bg-[#16181C] border border-white/10 rounded-xl shadow-2xl p-1 text-[11px] text-white/80">
                        {(['First created', 'Last created', 'Last changed', 'Name A-Z', 'Name Z-A'] as const).map(opt => (
                          <button
                            key={opt}
                            onClick={() => { setSortOption(opt); setShowSortMenu(false); }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/10 text-left"
                          >
                            <span>{opt}</span>
                            {sortOption === opt && <Check className="w-3 h-3 text-yellow-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {showProjectSearch && (
                <div className="px-1 pb-1.5">
                  <input
                    type="text"
                    placeholder="Find project.."
                    value={searchProjectQuery}
                    onChange={(e) => setSearchProjectQuery(e.target.value)}
                    className="w-full bg-[#18191C] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              )}

              {/* Exact Higgsfield "New project" Glass Button Style */}
              <button 
                onClick={onNewProject}
                className="group flex h-9 w-full items-center gap-2 rounded-xl px-1.5 text-left text-xs text-white/70 hover:text-white transition my-1"
              >
                <span className="relative size-6 shrink-0 rounded-lg border border-[rgba(197,197,197,0.3)] bg-white/10 shadow-[inset_0_-0.3px_5.36px_rgba(185,185,185,0.35)] flex items-center justify-center text-white">
                  <Plus className="w-3.5 h-3.5 text-yellow-400" />
                </span>
                <span className="font-medium text-white truncate">New project</span>
              </button>

              {/* User Projects List (Real SEE IT project from user account) */}
              <div className="space-y-1 mt-1">
                {filteredProjects.map((p) => {
                  const isActive = currentProject && currentProject.id === p.id && activeView === 'project';

                  return (
                    <div
                      key={p.id}
                      className={`relative w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition group ${
                        isActive 
                          ? 'bg-white/10 border border-white/15 text-white' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectProject(p.id);
                          onViewChange('project');
                        }}
                        className="flex items-center gap-2 truncate flex-1 text-left"
                      >
                        <img 
                          src={p.thumbnail} 
                          alt={p.title}
                          className="w-5 h-5 rounded-[6px] object-cover border border-white/10 shrink-0" 
                        />
                        <span className="font-semibold text-xs truncate">{p.title}</span>
                        <span className="text-[10px] font-mono text-white/40 group-hover:text-white/70 bg-black/30 px-1.5 py-0.2 rounded ml-auto mr-1">
                          {(p.assets || []).length}
                        </span>
                      </button>

                      {/* Project Options Menu */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuProjectId(activeMenuProjectId === p.id ? null : p.id);
                        }}
                        className="text-white/40 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {activeMenuProjectId === p.id && (
                        <div 
                          ref={menuRef}
                          className="absolute right-0 top-8 z-50 w-44 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in"
                        >
                          <button
                            onClick={() => {
                              onSelectProject(p.id);
                              onViewChange('project');
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#8692a3]" />
                            <span>Open project</span>
                          </button>

                          <button
                            onClick={() => {
                              const t = prompt('Rename project:', p.title);
                              if (t && t.trim() && onRenameProject) {
                                onRenameProject(p.id, t.trim());
                                showToast('Project renamed');
                              }
                              setActiveMenuProjectId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#8692a3]" />
                            <span>Rename</span>
                          </button>

                          {projects.length > 1 && (
                            <>
                              <div className="h-[1px] bg-[#242b38] my-1" />
                              <button
                                onClick={() => {
                                  if (confirm(`Delete project "${p.title}"?`)) {
                                    if (onDeleteProject) onDeleteProject(p.id);
                                    showToast('Project deleted');
                                  }
                                  setActiveMenuProjectId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-left transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete project</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chats Section (Direct Homepage Generations) - Directly below Projects */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-1.5 pb-1 text-[11px] font-semibold text-white/50">
                <span className="flex items-center gap-1.5 text-white/80">
                  <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Chats ({chats.length})</span>
                </span>
                <span className="text-[9px] bg-yellow-400/10 text-yellow-300 font-mono px-1.5 py-0.2 rounded border border-yellow-400/20">
                  Direct Home
                </span>
              </div>

              {chats.length === 0 ? (
                <div className="px-2 py-1.5 text-[10px] text-white/40 italic">
                  Prompts generated from Home appear here
                </div>
              ) : (
                <div className="space-y-0.5 mt-0.5 max-h-48 overflow-y-auto no-scrollbar">
                  {chats.map((chat) => {
                    const isChatActive = activeChatId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        className={`relative w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition group ${
                          isChatActive
                            ? 'bg-white/10 text-white border border-white/15'
                            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <button
                          onClick={() => onSelectChat && onSelectChat(chat.id)}
                          className="flex items-center gap-2 truncate flex-1 text-left"
                          title={chat.prompt}
                        >
                          {chat.asset?.thumbnail ? (
                            <img
                              src={chat.asset.thumbnail}
                              alt={chat.title}
                              className="w-5 h-5 rounded-[6px] object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <span className="w-5 h-5 rounded-[6px] bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <MessageSquare className="w-3 h-3 text-yellow-400/80" />
                            </span>
                          )}
                          <div className="truncate flex-1 min-w-0">
                            <span className="font-medium text-xs truncate block text-white/90">
                              {chat.title}
                            </span>
                            <span className="text-[9px] text-white/40 block truncate">
                              {chat.createdAt}
                            </span>
                          </div>
                        </button>

                        {/* Chat Options (3 dots) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuChatId(activeMenuChatId === chat.id ? null : chat.id);
                          }}
                          className="text-white/40 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {activeMenuChatId === chat.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-8 z-50 w-40 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in"
                          >
                            <button
                              onClick={() => {
                                onSelectChat && onSelectChat(chat.id);
                                setActiveMenuChatId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                            >
                              <Play className="w-3.5 h-3.5 text-yellow-400" />
                              <span>View video</span>
                            </button>
                            <button
                              onClick={() => {
                                const t = prompt('Rename chat:', chat.title);
                                if (t && t.trim() && onRenameChat) {
                                  onRenameChat(chat.id, t.trim());
                                  showToast('Chat renamed');
                                }
                                setActiveMenuChatId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#8692a3]" />
                              <span>Rename</span>
                            </button>
                            <div className="h-[1px] bg-[#242b38] my-1" />
                            <button
                              onClick={() => {
                                if (confirm(`Delete chat "${chat.title}"?`)) {
                                  if (onDeleteChat) onDeleteChat(chat.id);
                                  showToast('Chat deleted');
                                }
                                setActiveMenuChatId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 text-left transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Promo Card: "Learn to make movies" (Exact Higgsfield SSR HTML) */}
            {showPromoCard && (
              <div className="pt-2">
                <div className="relative flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.12)_100%)] p-2.5">
                  <button 
                    type="button"
                    aria-label="Close"
                    onClick={() => setShowPromoCard(false)} 
                    className="absolute right-2 top-2 z-10 flex items-center justify-center text-white/40 hover:text-white transition"
                  >
                    <svg aria-hidden="true" width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div className="flex flex-col gap-0.5 pr-4">
                    <p className="text-[10px] text-white/50">Learn to make movies</p>
                    <p className="text-[11px] font-semibold text-white leading-tight">Practical workflows from working AI filmmakers</p>
                  </div>
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                    <video 
                      src="https://static.higgsfield.ai/academy/catalog/invitations-workflow-preview.mp4" 
                      poster="https://static.higgsfield.ai/academy/catalog/invitations-workflow-preview.webp" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      preload="metadata" 
                      className="size-full object-cover"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => alert('Opening Nickfield Academy & Filmmaker Workflows')}
                    className="w-full py-1.5 rounded-xl bg-white hover:bg-slate-100 text-black font-semibold text-xs transition shadow"
                  >
                    Learn more
                  </button>
                </div>
              </div>
            )}

            {/* All Projects Button (Exact Higgsfield SSR HTML) */}
            <div className="pt-1.5">
              <button 
                type="button"
                onClick={() => onViewChange('home')}
                className="group flex h-9 w-full items-center gap-2 rounded-xl px-1.5 text-left text-xs text-white/70 hover:text-white transition"
              >
                <span className="relative overflow-hidden border border-[rgba(197,197,197,0.3)] bg-white/10 shadow-[inset_0_-0.3px_5.36px_rgba(185,185,185,0.35)] flex size-6 shrink-0 items-center justify-center rounded-lg text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-3.5">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 3.75h10.5m-12.5 3.5h14.5m.985 3.5H3.765a1 1 0 0 0-.974 1.23l1.777 7.5a1 1 0 0 0 .973.77h12.918a1 1 0 0 0 .973-.77l1.777-7.5a1 1 0 0 0-.974-1.23"/>
                  </svg>
                </span>
                <span className="truncate flex-1 font-medium">All projects</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-white/40">
                  <path fill="currentColor" d="M8.97 5.22a.75.75 0 0 1 1.06 0l6.25 6.25a.75.75 0 0 1 0 1.06l-6.25 6.25a.75.75 0 1 1-1.06-1.06L14.69 12 8.97 6.28a.75.75 0 0 1 0-1.06"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Project Drill-down Navigation */
          <div className="space-y-1">
            {/* Back to Home Button */}
            <button 
              onClick={() => onViewChange('home')}
              className="flex items-center gap-1.5 text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition mb-1 font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            {/* Current Project Header Info */}
            <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white mb-2 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <img 
                  src={currentProject.thumbnail} 
                  alt={currentProject.title} 
                  className="w-6 h-6 rounded object-cover border border-white/10 shrink-0" 
                />
                <div className="min-w-0">
                  <div className="font-bold text-xs truncate">{currentProject.title}</div>
                  <div className="text-[10px] text-white/50 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 text-yellow-400/80" /> Private
                  </div>
                </div>
              </div>
            </div>

            {/* Project Menu Items */}
            <button 
              onClick={onOpenBrief}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition text-left"
            >
              <FileText className="w-4 h-4 text-white/60" />
              <span>Project brief</span>
            </button>

            <button 
              onClick={onOpenSettings}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition text-left"
            >
              <Settings className="w-4 h-4 text-white/60" />
              <span>Settings</span>
            </button>

            {/* Elements System Trigger */}
            <button 
              onClick={onOpenElements}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-white font-medium bg-[#1e2531] border border-[#2f394a] shadow-sm text-left hover:border-yellow-400/50 transition"
            >
              <div className="flex items-center gap-2.5">
                <AtSign className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold">Elements</span>
              </div>
              <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-1.5 py-0.5 rounded-md">
                {currentProject.elements.length}
              </span>
            </button>

            {/* Tools Section */}
            <div className="pt-2">
              <div className="px-2 pb-1 text-[11px] font-semibold text-white/50 flex items-center justify-between">
                <span>Tools</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>

              <button
                onClick={() => onSelectTool('canvas')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                  selectedTool === 'canvas' ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-yellow-400" />
                <span>Canvas</span>
              </button>

              <button
                onClick={() => onSelectTool('chat')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                  selectedTool === 'chat' ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Generations / Chat</span>
              </button>

              <button
                onClick={() => onSelectTool('director')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
                  selectedTool === 'director' ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
                <span>Director Mode</span>
              </button>

              <button
                onClick={() => onSelectTool('editor')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                  selectedTool === 'editor' ? 'bg-yellow-400 text-black font-bold shadow' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className={`w-3.5 h-3.5 ${selectedTool === 'editor' ? 'text-black' : 'text-cyan-400'}`} />
                  <span>Video Editor</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${selectedTool === 'editor' ? 'bg-black/20 text-black font-bold' : 'bg-[#1e2531] text-cyan-300'}`}>
                  Revise
                </span>
              </button>
            </div>

            {/* Folders Section - Hierarchical Tree */}
            <div className="pt-2">
              <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold text-white/50">
                <span className="flex items-center gap-1.5">
                  <Folder className="w-3 h-3 text-yellow-400" />
                  <span>Project Folders</span>
                </span>
                <button 
                  onClick={() => {
                    const name = prompt('New Main Folder name:');
                    if (name && name.trim() && onAddFolder) onAddFolder(name.trim(), null);
                  }}
                  className="hover:text-white p-0.5 rounded transition flex items-center gap-1 text-[10px] text-yellow-400/80 hover:text-yellow-300"
                  title="Add Root Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* All Assets Folder */}
              {(() => {
                const allFolder = currentProject.folders.find(f => f.id === 'all') || { id: 'all', name: 'All assets', assetCount: currentProject.assets.length };
                const isSelected = selectedFolderId === 'all';
                return (
                  <div
                    key="folder-all"
                    className={`relative group flex items-center justify-between px-2.5 py-1.5 rounded-lg transition mb-1 ${
                      isSelected ? 'bg-yellow-400/20 text-yellow-300 font-semibold border border-yellow-400/30' : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => onSelectFolder('all')}
                      className="flex items-center gap-2 truncate flex-1 text-left"
                    >
                      <Layers className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      <span className="truncate">All Project Videos</span>
                    </button>
                    <span className="text-[10px] font-mono text-white/40 group-hover:text-white/70 bg-black/40 px-1.5 py-0.2 rounded">
                      {currentProject.assets.length}
                    </span>
                  </div>
                );
              })()}

              {/* Root Folders & Nested Subfolders */}
              <div className="space-y-0.5">
                {currentProject.folders.filter(f => !f.parentId && f.id !== 'all').map((rootFolder) => {
                  const isSelected = selectedFolderId === rootFolder.id;
                  const isExpanded = expandedFolderIds.includes(rootFolder.id);
                  const subfolders = currentProject.folders.filter(sub => sub.parentId === rootFolder.id);
                  const folderColor = folderColors[rootFolder.id] || rootFolder.color || '#eab308';

                  return (
                    <div key={rootFolder.id} className="space-y-0.5">
                      {/* Root Folder Row */}
                      <div
                        className={`relative group flex items-center justify-between px-2 py-1.5 rounded-lg transition ${
                          isSelected ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {subfolders.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedFolderIds(prev => 
                                  prev.includes(rootFolder.id) ? prev.filter(id => id !== rootFolder.id) : [...prev, rootFolder.id]
                                );
                              }}
                              className="text-white/40 hover:text-white p-0.5 rounded transition shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-white/60" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-white/60" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 shrink-0" />
                          )}

                          <button
                            onClick={() => onSelectFolder(rootFolder.id)}
                            className="flex items-center gap-1.5 truncate flex-1 text-left"
                          >
                            <Folder 
                              className="w-3.5 h-3.5 shrink-0" 
                              style={{ color: folderColor }}
                            />
                            <span className="truncate text-xs">{rootFolder.name}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono text-white/40 group-hover:text-white/70 bg-black/30 px-1.5 py-0.2 rounded">
                            {rootFolder.assetCount ?? 0}
                          </span>

                          {/* Quick Add Subfolder button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const name = prompt(`Add subfolder inside "${rootFolder.name}":`);
                              if (name && name.trim() && onAddFolder) {
                                onAddFolder(name.trim(), rootFolder.id);
                                if (!expandedFolderIds.includes(rootFolder.id)) {
                                  setExpandedFolderIds(prev => [...prev, rootFolder.id]);
                                }
                                showToast(`Added subfolder "${name}"`);
                              }
                            }}
                            className="text-white/40 hover:text-yellow-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                            title={`Add subfolder to ${rootFolder.name}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuFolderId(activeMenuFolderId === rootFolder.id ? null : rootFolder.id);
                            }}
                            className="text-white/40 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Root Folder Menu */}
                        {activeMenuFolderId === rootFolder.id && (
                          <div 
                            ref={menuRef}
                            className="absolute right-0 top-8 z-50 w-48 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in"
                          >
                            <button
                              onClick={() => {
                                const name = prompt(`Add subfolder inside "${rootFolder.name}":`);
                                if (name && name.trim() && onAddFolder) {
                                  onAddFolder(name.trim(), rootFolder.id);
                                  if (!expandedFolderIds.includes(rootFolder.id)) {
                                    setExpandedFolderIds(prev => [...prev, rootFolder.id]);
                                  }
                                }
                                setActiveMenuFolderId(null);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                            >
                              <Plus className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Add Subfolder</span>
                            </button>
                            <button
                              onClick={() => handleEditFolder(rootFolder)}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#8692a3]" />
                              <span>Rename</span>
                            </button>
                            {onDeleteFolder && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete folder "${rootFolder.name}" and its subfolders?`)) {
                                    onDeleteFolder(rootFolder.id);
                                    showToast('Folder deleted');
                                  }
                                  setActiveMenuFolderId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 text-left transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Nested Subfolders (Rendered if expanded) */}
                      {isExpanded && subfolders.length > 0 && (
                        <div className="ml-4 pl-2.5 border-l border-white/10 space-y-0.5 py-0.5">
                          {subfolders.map((subfolder) => {
                            const isSubSelected = selectedFolderId === subfolder.id;
                            const subColor = folderColors[subfolder.id] || subfolder.color || '#06b6d4';

                            return (
                              <div
                                key={subfolder.id}
                                className={`relative group flex items-center justify-between px-2 py-1 rounded-lg transition ${
                                  isSubSelected ? 'bg-white/15 text-white font-medium border border-cyan-500/40' : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <button
                                  onClick={() => onSelectFolder(subfolder.id)}
                                  className="flex items-center gap-2 truncate flex-1 text-left"
                                >
                                  <Folder 
                                    className="w-3 h-3 shrink-0" 
                                    style={{ color: subColor }}
                                  />
                                  <span className="truncate text-[11px]">{subfolder.name}</span>
                                </button>

                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] font-mono text-white/40 bg-black/20 px-1 py-0.2 rounded">
                                    {subfolder.assetCount ?? 0}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuFolderId(activeMenuFolderId === subfolder.id ? null : subfolder.id);
                                    }}
                                    className="text-white/40 hover:text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <MoreVertical className="w-2.5 h-2.5" />
                                  </button>
                                </div>

                                {/* Subfolder Menu */}
                                {activeMenuFolderId === subfolder.id && (
                                  <div 
                                    ref={menuRef}
                                    className="absolute right-0 top-6 z-50 w-40 bg-[#181d25] border border-[#2a3342] rounded-xl shadow-2xl p-1 text-xs text-[#cbd3de] animate-in fade-in"
                                  >
                                    <button
                                      onClick={() => handleEditFolder(subfolder)}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202633] text-left hover:text-white transition"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-[#8692a3]" />
                                      <span>Rename</span>
                                    </button>
                                    {onDeleteFolder && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete subfolder "${subfolder.name}"?`)) {
                                            onDeleteFolder(subfolder.id);
                                            showToast('Subfolder deleted');
                                          }
                                          setActiveMenuFolderId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 text-left transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Section (Exact Higgsfield HTML: Digital Sense, Avatar progress circle, Upgrade 30% OFF, Bell) */}
      <div className="p-2 border-t border-white/5 space-y-1.5 shrink-0">
        {/* Upgrade Banner with Rocket Icon and 30% OFF */}
        <div className="w-full">
          <button 
            type="button"
            onClick={() => showToast('Plans: Creator, Pro, Max (30% Discount active)')}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white transition text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <svg className="size-4 text-white/80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.86111 13.25H4.93454C4.17548 13.25 3.69317 12.4375 4.05665 11.7711L5.96574 8.27115C6.14097 7.94989 6.47769 7.75 6.84363 7.75H11.2292M6.86111 13.25L10.75 17.1389M6.86111 13.25L11.2292 7.75M10.75 17.1389V19.0655C10.75 19.8245 11.5625 20.3068 12.2289 19.9434L15.7289 18.0343C16.0501 17.859 16.25 17.5223 16.25 17.1564V12.7708M10.75 17.1389L16.25 12.7708M16.25 12.7708C19.0783 10.1782 20.9249 7.36947 21.2111 3.74957C21.2546 3.199 20.801 2.7454 20.2504 2.78892C16.6305 3.07508 13.8218 4.92172 11.2292 7.75M4.80556 21.25H3.75C3.19771 21.25 2.75 20.8023 2.75 20.25V19.1945C2.75 18.0592 3.6703 17.1389 4.80556 17.1389C5.94081 17.1389 6.86111 18.0592 6.86111 19.1945C6.86111 20.3297 5.94081 21.25 4.80556 21.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <span>Upgrade</span>
            </div>
            <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded font-black tracking-wider">
              30% OFF
            </span>
          </button>
        </div>

        {/* Profile Card with Circular Progress Meter & Notification Bell */}
        <div className="flex items-center justify-between gap-1 w-full pt-0.5">
          <div 
            onClick={onOpenTokenManager}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/10 cursor-pointer transition flex-1 min-w-0 group"
            title="Click to manage BytePlus Tokens"
          >
            <div className="relative shrink-0 w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-1 overflow-hidden rounded-full">
                <img 
                  src="https://static.higgsfield.ai/profile/avatar.png" 
                  alt="Avatar" 
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <svg className="transform -rotate-90 w-6 h-6">
                <circle r="11" cx="12" cy="12" stroke="rgba(255,255,255,0.12)" fill="transparent" strokeWidth="2" />
                <circle 
                  r="11" 
                  cx="12" 
                  cy="12" 
                  fill="transparent" 
                  strokeLinecap="round" 
                  strokeWidth="2" 
                  strokeDashoffset="8.3" 
                  strokeDasharray="69.1" 
                  stroke="#D1FE17"
                  className="transition-all duration-500" 
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white flex items-center justify-between">
                <span>Digital</span>
                <span suppressHydrationWarning className="text-[10px] font-mono text-[#D1FE17] font-bold">
                  {tokenBalance >= 1000000 ? `${(tokenBalance / 1000000).toFixed(1)}M` : `${Math.round(tokenBalance / 1000)}k`}
                </span>
              </div>
              <div className="text-[9px] text-white/50 flex items-center gap-1 font-mono truncate">
                <span>108.9k / video</span>
              </div>
            </div>
          </div>

          {/* Notifications Bell */}
          <button 
            type="button" 
            aria-label="Notifications" 
            onClick={() => showToast('ModelArk Seedance 2.5: 108,900 tokens/video')}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <svg className="size-3.5" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20.25 16.2441C20.25 16.7964 19.8023 17.25 19.25 17.25H4.75C4.19772 17.25 3.75 16.7964 3.75 16.2441V16.2441C3.75 16.0846 3.78813 15.9261 3.8612 15.7843L5.19785 13.192C5.26311 13.0655 5.30059 12.9264 5.30777 12.7842L5.50351 8.90897C5.6766 5.45882 8.53386 2.75 12 2.75C15.4661 2.75 18.3234 5.45882 18.4965 8.90897L18.6922 12.7842C18.6994 12.9264 18.7369 13.0655 18.8021 13.192L20.1388 15.7843C20.2119 15.9261 20.25 16.0846 20.25 16.2441V16.2441Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 17.25C16 19.4591 14.2091 21.25 12 21.25C9.79086 21.25 8 19.4591 8 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
