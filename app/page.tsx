'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PromptBox, { GenerationSettings } from '@/components/PromptBox';
import ElementsModal from '@/components/ElementsModal';
import ProjectBriefModal from '@/components/ProjectBriefModal';
import VideoPlayerModal from '@/components/VideoPlayerModal';
import MyGenerationsView from '@/components/MyGenerationsView';
import TokenManagerModal from '@/components/TokenManagerModal';
import DirectorStudio from '@/components/DirectorStudio';
import VideoEditorStudio from '@/components/VideoEditorStudio';
import { initialProjects, initialGlobalElements, initialDirectChats } from '@/data/defaultData';
import { Project, ProjectFolder, ElementReference, GeneratedAsset, DirectChat, TrialQuota } from '@/types';
import { 
  getDefaultProjectFolders, 
  getFolderPath, 
  updateFolderAssetCounts, 
  buildFolderTree,
  FolderNode 
} from '@/lib/folderUtils';
import { 
  Play, 
  Sparkles, 
  Plus, 
  Lock, 
  Film, 
  AtSign, 
  Layers, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  SlidersHorizontal,
  FolderOpen,
  Folder,
  FolderPlus,
  FolderTree,
  MoveRight,
  CornerDownRight,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Zap,
  Info,
  Check,
  X,
  Camera,
  Scissors
} from 'lucide-react';

const STORAGE_PROJECTS_KEY = 'nickfield_projects_v2';
const STORAGE_ACTIVE_PROJ_KEY = 'nickfield_active_project_id_v2';
const STORAGE_GLOBAL_ELEMS_KEY = 'nickfield_global_elements_v2';
const STORAGE_CHATS_KEY = 'nickfield_direct_chats_v3';
const STORAGE_TOKEN_BAL_KEY = 'nickfield_token_balance_v1';
const STORAGE_TOTAL_TOKENS_KEY = 'nickfield_total_tokens_used_v1';

export default function CinemaStudioPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProjects[0].id);
  const [globalElements, setGlobalElements] = useState<ElementReference[]>(initialGlobalElements);
  const [chats, setChats] = useState<DirectChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [promptValue, setPromptValue] = useState<string>('');
  const [promptElements, setPromptElements] = useState<ElementReference[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'project' | 'generations'>('home');
  const [isLoaded, setIsLoaded] = useState(false);

  // BytePlus ModelArk Token Balance (e.g. 5,000,000 trial credits)
  const [tokenBalance, setTokenBalance] = useState<number>(5000000);
  const [totalTokensUsed, setTotalTokensUsed] = useState<number>(3748975);
  const [trialQuota, setTrialQuota] = useState<TrialQuota | null>({
    enabled: true,
    totalLimit: 5000000,
    remaining: 1251025,
    used: 3748975,
    source: 'BytePlus ModelArk Free Trial',
    status: 'Active (Free Trial Consuming)',
  });
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Fetch live token data directly from server-side source of truth
  const fetchLiveTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const data = await res.json();
        if (data.currentBalance !== undefined) {
          setTokenBalance(data.currentBalance);
          setTotalTokensUsed(data.totalUsed || 0);
          try {
            localStorage.setItem(STORAGE_TOKEN_BAL_KEY, data.currentBalance.toString());
            localStorage.setItem(STORAGE_TOTAL_TOKENS_KEY, (data.totalUsed || 0).toString());
          } catch (e) {}
        }
        if (data.trialQuota) {
          setTrialQuota(data.trialQuota);
        }
      }
    } catch (e) {
      console.warn('[Nickfield AI] Error fetching live tokens:', e);
    }
  };

  // Modals state
  const [isElementsModalOpen, setIsElementsModalOpen] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);

  // Tools & Folder Selection
  const [selectedTool, setSelectedTool] = useState<'canvas' | 'chat' | 'director' | 'editor'>('canvas');
  const [editingAsset, setEditingAsset] = useState<GeneratedAsset | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [generationError, setGenerationError] = useState<{ title: string; message: string; hint?: string; taskId?: string } | null>(null);

  // 1. Load from server-backed persistent database and localStorage on mount
  useEffect(() => {
    fetchLiveTokens();

    // Fetch authoritative server projects & elements
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (Array.isArray(data.projects) && data.projects.length > 0) {
            const normalized = data.projects.map((p: Project) => {
              const baseFolders = p.folders && p.folders.length > 0 ? p.folders : getDefaultProjectFolders(p.title);
              return {
                ...p,
                dedicatedFolder: p.dedicatedFolder || p.title,
                folders: updateFolderAssetCounts(baseFolders, p.assets || []),
              };
            });
            setProjects(normalized);
            if (data.activeProjectId) {
              setActiveProjectId(data.activeProjectId);
            }
          }
          if (Array.isArray(data.globalElements) && data.globalElements.length > 0) {
            setGlobalElements(data.globalElements);
          }
          if (Array.isArray(data.chats)) {
            setChats(data.chats);
          }
        }
      })
      .catch(err => {
        console.warn('Server project fetch error, falling back to localStorage:', err);
        try {
          const storedProjects = localStorage.getItem(STORAGE_PROJECTS_KEY);
          if (storedProjects) {
            const parsed = JSON.parse(storedProjects);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProjects(parsed);
            }
          }
        } catch (e) {}
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Save projects to both server disk and localStorage
  const persistProjects = (updated: Project[]) => {
    setProjects(updated);
    try {
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage quota notice (safe: saved to server):', e);
    }
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projects: updated }),
    }).catch(err => console.warn('Server project sync notice:', err));
  };

  // Save direct chats to both server disk and localStorage
  const persistChats = (updated: DirectChat[]) => {
    setChats(updated);
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage quota notice (safe: saved to server):', e);
    }
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chats: updated }),
    }).catch(err => console.warn('Server chats sync notice:', err));
  };

  // Save global elements to both server disk and localStorage
  const persistGlobalElements = (updated: ElementReference[]) => {
    setGlobalElements(updated);
    try {
      localStorage.setItem(STORAGE_GLOBAL_ELEMS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage quota notice (safe: saved to server):', e);
    }
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ globalElements: updated }),
    }).catch(err => console.warn('Server elements sync notice:', err));
  };

  const handleUpdateBalance = async (newBalance: number) => {
    setTokenBalance(newBalance);
    try {
      localStorage.setItem(STORAGE_TOKEN_BAL_KEY, newBalance.toString());
      await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_balance', balance: newBalance }),
      });
      fetchLiveTokens();
    } catch (e) {
      console.error('Failed to sync updated balance to server:', e);
    }
  };

  const handleUpdateTrial = (updated: Partial<TrialQuota>) => {
    setTrialQuota(prev => (prev ? { ...prev, ...updated } : (updated as TrialQuota)));
    fetchLiveTokens();
  };

  // Select active project and persist
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    try {
      localStorage.setItem(STORAGE_ACTIVE_PROJ_KEY, id);
    } catch (e) {}
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeProjectId: id }),
    }).catch(() => {});
  };

  // Current active project lookup
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0] || initialProjects[0];

  // Create brand new project (NEVER replaces existing projects!)
  const handleCreateNewProject = (defaultName?: string) => {
    const title = prompt('Enter project title:', defaultName || `Project 0${projects.length + 1}`);
    if (!title || !title.trim()) return;

    const cleanTitle = title.trim();
    const initialFolders = getDefaultProjectFolders(cleanTitle);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: cleanTitle,
      dedicatedFolder: cleanTitle,
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
      isPrivate: true,
      brief: `# Project: ${cleanTitle}\n\nAdd your cinematic notes, character descriptions, and aesthetic locks here.`,
      elements: [], // STRICTLY EMPTY! Clean project with no pre-filled elements
      folders: initialFolders,
      assets: [],
    };

    const updated = [newProject, ...projects];
    persistProjects(updated);
    handleSelectProject(newProject.id);
    setSelectedFolderId('all');
    setActiveView('project');
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, title: newTitle, dedicatedFolder: newTitle } : p);
    persistProjects(updated);
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert('Cannot delete the last remaining project.');
      return;
    }
    const updated = projects.filter(p => p.id !== id);
    persistProjects(updated);
    if (activeProjectId === id) {
      handleSelectProject(updated[0].id);
    }
  };

  // Video Generation Pipeline
  const handleGenerate = async (
    prompt: string, 
    selectedElements: ElementReference[], 
    settings: GenerationSettings
  ) => {
    setGenerationError(null);
    setIsGenerating(true);
    setElapsedSeconds(0);
    setGenerationStage('Step 1/4: Analyzing multimodal entity tags & narrative continuity...');

    const intervalTimer = setInterval(() => {
      setElapsedSeconds(s => s + 1);
    }, 1000);

    const stageTimer1 = setTimeout(() => {
      setGenerationStage(`Step 2/4: Locking ${selectedElements.length} references (${selectedElements.map(e => e.tag).join(', ')})...`);
    }, 1500);

    const stageTimer2 = setTimeout(() => {
      setGenerationStage('Step 3/4: BytePlus ModelArk Seedance 2.5 GPU DiT Diffusion...');
    }, 4000);

    const stageTimer3 = setTimeout(() => {
      setGenerationStage('Step 4/4: Synchronizing native AI audio & cinema grade...');
    }, 9000);

    // Determine target project subfolder
    let targetFolderId = selectedFolderId;
    if (!targetFolderId || targetFolderId === 'all') {
      const res = settings.resolution?.toLowerCase() || '';
      if (res.includes('1080')) {
        targetFolderId = 'renders-1080p';
      } else if (res.includes('720')) {
        targetFolderId = 'renders-720p';
      } else {
        targetFolderId = 'renders';
      }
    }
    const targetFolderPath = getFolderPath(currentProject.folders || [], targetFolderId);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          elements: selectedElements, 
          settings,
          projectId: currentProject.id,
          projectTitle: currentProject.title,
          folderId: targetFolderId,
          folderPath: targetFolderPath,
          projectBrief: currentProject.brief,
          previousShots: currentProject.assets.slice(0, 4),
        }),
      });

      const data = await res.json();
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearInterval(intervalTimer);

      if (data.success && data.asset) {
        // Sync live authoritative tokens from server
        fetchLiveTokens();

        // Live ModelArk token deduction
        const spent = data.asset.tokensUsed || (parseInt(settings.duration || '5', 10) * 21780);
        setTokenBalance(prev => {
          const next = data.liveRemainingBalance ?? Math.max(0, prev - spent);
          try { localStorage.setItem(STORAGE_TOKEN_BAL_KEY, next.toString()); } catch (e) {}
          return next;
        });
        setTotalTokensUsed(prev => {
          const next = prev + spent;
          try { localStorage.setItem(STORAGE_TOTAL_TOKENS_KEY, next.toString()); } catch (e) {}
          return next;
        });

        if (activeView === 'home') {
          // Save as Direct Home Chat session
          const cleanTitle = prompt.trim().slice(0, 36) + (prompt.trim().length > 36 ? '...' : '');
          const newChat: DirectChat = {
            id: `chat-${Date.now()}`,
            title: cleanTitle || 'Untitled Home Generation',
            prompt: prompt.trim(),
            asset: data.asset,
            elementsUsed: selectedElements,
            createdAt: 'Just now',
          };
          persistChats([newChat, ...chats]);
          setActiveChatId(newChat.id);
          setPromptValue(prompt);
          setPromptElements(selectedElements);
          setSelectedAsset(data.asset);
        } else {
          // Save to current active project and update folder counts
          const updatedProjects = projects.map(p => {
            if (p.id === currentProject.id) {
              const newAssets = [data.asset, ...p.assets];
              const updatedFolders = updateFolderAssetCounts(p.folders || [], newAssets);
              return {
                ...p,
                assets: newAssets,
                folders: updatedFolders,
              };
            }
            return p;
          });
          persistProjects(updatedProjects);
          setSelectedAsset(data.asset);
        }
      } else {
        const errMsg = data.error || 'BytePlus generation did not return a video. Please verify your prompt and settings.';
        const errTaskId = data.taskId || (typeof errMsg === 'string' ? errMsg.match(/cgt-\d+-[a-z0-9]+/)?.[0] : undefined);
        let dynamicHint: string | undefined = undefined;
        if (typeof errMsg === 'string' && (errMsg.includes('overdue') || errMsg.includes('balance') || errMsg.includes('AccountOverdueError'))) {
          dynamicHint = 'BytePlus ModelArk Console me account billing/overdue balance check karein.';
        } else if (selectedElements.length > 0) {
          dynamicHint = 'Higgsfield engine auto-conditions references to protect character identity. Check references in the Elements drawer.';
        }
        setGenerationError({
          title: 'BytePlus ModelArk Generation Notice',
          message: errMsg,
          taskId: errTaskId,
          hint: dynamicHint,
        });
      }
    } catch (err: any) {
      console.error(err);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearInterval(intervalTimer);
      setGenerationError({
        title: 'Connection / Server Notice',
        message: err.message || 'Network or server issue during task dispatch.',
      });
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearInterval(intervalTimer);
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  // Recover completed task by ID directly from BytePlus ModelArk
  const handleRecoverTask = async (taskId: string) => {
    try {
      setGenerationStage(`Checking BytePlus ModelArk status for task ${taskId}...`);
      setIsGenerating(true);
      const targetFolderId = selectedFolderId !== 'all' ? selectedFolderId : 'renders-1080p';
      const targetFolderPath = getFolderPath(currentProject.folders || [], targetFolderId);

      const res = await fetch(`/api/check-task?taskId=${taskId}&projectId=${currentProject.id}&projectTitle=${encodeURIComponent(currentProject.title)}&folderId=${targetFolderId}&folderPath=${encodeURIComponent(targetFolderPath)}`);
      const data = await res.json();
      setIsGenerating(false);
      setGenerationStage('');

      if (data.success && data.asset && (data.status === 'succeeded' || data.status === 'SUCCESS')) {
        setGenerationError(null);
        fetchLiveTokens();
        // Add recovered asset to current active project with updated folder counts
        const updatedProjects = projects.map(p => {
          if (p.id === currentProject.id) {
            const newAssets = [data.asset, ...p.assets.filter(a => a.id !== data.asset.id)];
            const updatedFolders = updateFolderAssetCounts(p.folders || [], newAssets);
            return {
              ...p,
              assets: newAssets,
              folders: updatedFolders,
            };
          }
          return p;
        });
        persistProjects(updatedProjects);
        setSelectedAsset(data.asset);
      } else {
        alert(data.status ? `Task status: ${data.status}. GPU is still processing on ByteDance ModelArk.` : (data.error || 'Unable to recover task yet.'));
      }
    } catch (e: any) {
      setIsGenerating(false);
      setGenerationStage('');
      alert('Error querying task status: ' + e.message);
    }
  };

  // Direct Chats handlers
  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setActiveView('home');
    const targetChat = chats.find(c => c.id === id);
    if (targetChat) {
      setPromptValue(targetChat.prompt || '');
      setPromptElements(targetChat.elementsUsed || []);
      if (targetChat.asset) {
        setSelectedAsset(targetChat.asset);
      }
    }
  };

  const handleDeleteChat = (id: string) => {
    const updated = chats.filter(c => c.id !== id);
    persistChats(updated);
    if (activeChatId === id) {
      setActiveChatId(null);
      setPromptValue('');
      setPromptElements([]);
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    const updated = chats.map(c => c.id === id ? { ...c, title: newTitle } : c);
    persistChats(updated);
  };

  // Elements handlers - STRICT PROJECT ISOLATION (No Cross-Project Mixing!)
  const handleAddElement = (newElement: ElementReference) => {
    if (activeView === 'home') {
      // Add to global elements (Home canvas only)
      if (!globalElements.some(e => e.id === newElement.id)) {
        persistGlobalElements([...globalElements, newElement]);
      }
    } else {
      // Strictly project-bound: Belongs ONLY to currentProject!
      const projectBoundElement: ElementReference = {
        ...newElement,
        projectId: currentProject.id,
        projectTitle: currentProject.title,
      };
      const updatedProjects = projects.map(p => {
        if (p.id === currentProject.id) {
          return {
            ...p,
            elements: [...p.elements.filter(e => e.id !== newElement.id), projectBoundElement],
          };
        }
        return p;
      });
      persistProjects(updatedProjects);
    }
  };

  const handleDeleteElement = (id: string) => {
    if (activeView === 'home') {
      // Delete from global elements
      persistGlobalElements(globalElements.filter(e => e.id !== id));
    } else {
      // Delete from current project
      const updatedProjects = projects.map(p => {
        if (p.id === currentProject.id) {
          return {
            ...p,
            elements: p.elements.filter(e => e.id !== id),
          };
        }
        return p;
      });
      persistProjects(updatedProjects);
    }
  };

  const handleLinkGlobalElement = (element: ElementReference) => {
    if (!currentProject.elements.some(e => e.id === element.id)) {
      const updatedProjects = projects.map(p => {
        if (p.id === currentProject.id) {
          return {
            ...p,
            elements: [...p.elements, element],
          };
        }
        return p;
      });
      persistProjects(updatedProjects);
    }
  };

  // Folders handlers
  const handleAddFolder = (name: string, parentId?: string | null) => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const newFolderId = `folder-${Date.now()}`;
    const newFolder: ProjectFolder = {
      id: newFolderId,
      name: cleanName,
      parentId: parentId || null,
      category: 'custom',
      color: '#eab308',
      assetCount: 0,
    };

    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        const nextFolders = updateFolderAssetCounts([...p.folders, newFolder], p.assets);
        return {
          ...p,
          folders: nextFolders,
        };
      }
      return p;
    });
    persistProjects(updatedProjects);
    setSelectedFolderId(newFolderId);
  };

  const handleDeleteFolder = (id: string) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        const remainingFolders = p.folders.filter(f => f.id !== id && f.parentId !== id);
        return {
          ...p,
          folders: updateFolderAssetCounts(remainingFolders, p.assets),
        };
      }
      return p;
    });
    persistProjects(updatedProjects);
    if (selectedFolderId === id) {
      setSelectedFolderId('all');
    }
  };

  // Move video asset between folders
  const handleMoveAsset = (assetId: string, targetFolderId: string) => {
    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        const targetPath = getFolderPath(p.folders, targetFolderId);
        const updatedAssets = p.assets.map(a => {
          if (a.id === assetId) {
            return {
              ...a,
              folderId: targetFolderId,
              folderPath: targetPath,
            };
          }
          return a;
        });
        return {
          ...p,
          assets: updatedAssets,
          folders: updateFolderAssetCounts(p.folders, updatedAssets),
        };
      }
      return p;
    });
    persistProjects(updatedProjects);
  };

  const chatAssets = chats.filter(c => c.asset).map(c => c.asset as GeneratedAsset);
  const allAssets = [...projects.flatMap(p => p.assets), ...chatAssets];

  // Resolve current project's folder hierarchy with accurate asset counts
  const currentProjectFolders = currentProject.folders && currentProject.folders.length > 0
    ? currentProject.folders
    : getDefaultProjectFolders(currentProject.title);

  const activeFolder = currentProjectFolders.find(f => f.id === selectedFolderId);

  // Filter project assets according to selectedFolderId (including child subfolders)
  const displayedProjectAssets = currentProject.assets.filter(asset => {
    if (!selectedFolderId || selectedFolderId === 'all') return true;
    if (asset.folderId === selectedFolderId) return true;
    const childFolderIds = currentProjectFolders.filter(f => f.parentId === selectedFolderId).map(f => f.id);
    return asset.folderId && childFolderIds.includes(asset.folderId);
  });

  return (
    <div className="min-h-screen bg-[#0b0d0e] flex flex-col font-sans text-white">
      {/* Top Navbar with Live ModelArk Token Counter & Trial Quotas */}
      <Header 
        tokenBalance={tokenBalance} 
        trialQuota={trialQuota}
        onOpenTokenManager={() => setIsTokenModalOpen(true)} 
      />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentProject={currentProject}
          projects={projects}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenElements={() => setIsElementsModalOpen(true)}
          onOpenBrief={() => setIsBriefModalOpen(true)}
          onOpenSettings={() => alert(`Cinema Studio Settings for "${currentProject.title}": Default 1080p, ByteDance Seedance 2.5 Engine.`)}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onNewProject={() => handleCreateNewProject()}
          onSelectProject={handleSelectProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
          totalGlobalElementsCount={globalElements.length}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          tokenBalance={tokenBalance}
          onOpenTokenManager={() => setIsTokenModalOpen(true)}
        />

        {/* Conditional Rendering: My Generations View vs Director Studio vs Video Editor vs Home/Project Studio Stage */}
        {activeView === 'generations' ? (
          <MyGenerationsView
            allAssets={allAssets}
            onSelectAsset={setSelectedAsset}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onOpenElements={() => setIsElementsModalOpen(true)}
            globalElements={globalElements}
            projects={projects}
            onSelectProject={handleSelectProject}
            onViewChange={setActiveView}
            onEditAsset={(asset) => {
              if (asset.projectId) {
                handleSelectProject(asset.projectId);
              }
              setEditingAsset(asset);
              setSelectedTool('editor');
              setActiveView('project');
            }}
          />
        ) : selectedTool === 'director' ? (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-7 no-scrollbar relative">
            <DirectorStudio
              currentProject={currentProject}
              globalElements={globalElements}
              onApplyPrompt={(prompt) => {
                setPromptValue(prompt);
                setSelectedTool('canvas');
              }}
              onGenerateShot={(prompt, elems, stngs) => {
                setSelectedTool('canvas');
                handleGenerate(prompt, elems, stngs || {
                  model: 'Seedance 2.5',
                  aspectRatio: '16:9',
                  resolution: '1080p',
                  duration: '8s',
                  bitrate: 'High',
                  sound: true,
                  batchCount: 1,
                  referenceMode: 'References',
                  referencesCount: elems.length,
                });
              }}
              onClose={() => setSelectedTool('canvas')}
            />
          </main>
        ) : selectedTool === 'editor' ? (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-7 no-scrollbar relative">
            <VideoEditorStudio
              currentProject={currentProject}
              allAssets={allAssets}
              initialAsset={editingAsset}
              onSaveEditedAsset={(updatedAsset) => {
                const updatedProjects = projects.map(p => {
                  if (p.id === currentProject.id) {
                    return {
                      ...p,
                      assets: p.assets.map(a => a.id === updatedAsset.id ? updatedAsset : a),
                    };
                  }
                  return p;
                });
                persistProjects(updatedProjects);
              }}
              onGenerateRevised={(prompt, elems, stngs, origId) => {
                handleGenerate(prompt, elems, stngs);
                setSelectedTool('canvas');
              }}
              isGenerating={isGenerating}
              onClose={() => setSelectedTool('canvas')}
            />
          </main>
        ) : (
          /* Center Main Stage Canvas */
          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-7 no-scrollbar relative">
          
          {/* Top Banner Hero Carousel (Screenshot 2 / media_1790626774545.jpg) */}
          <div className="w-full max-w-[860px] mx-auto text-center space-y-4 pt-1">
            {/* Real Film Carousel Cards */}
            <div className="flex items-center justify-center gap-3.5 select-none py-1 overflow-visible">
              {/* Left Card: Zephyr Special */}
              <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-2xl overflow-hidden relative border border-[#2b3345] shadow-lg opacity-75 scale-95 hover:opacity-100 hover:scale-100 transition-all duration-300 group cursor-pointer">
                <video
                  src="https://cdn.higgsfield.ai/card/f60a053b-0878-43c5-9121-d08e2165ad5c.mp4"
                  poster="https://static.higgsfield.ai/contest/open-projects/zephyr-poster-3891-26953-20260807.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider truncate">
                    ZEPHYR SPECIAL
                  </span>
                </div>
              </div>

              {/* Center Featured Card: The Cully Hill Boys */}
              <div className="w-40 sm:w-48 h-24 sm:h-28 rounded-2xl overflow-hidden relative border-2 border-emerald-400/80 shadow-[0_0_24px_rgba(52,211,153,0.35)] scale-105 hover:scale-110 transition-all duration-300 group cursor-pointer z-10">
                <video
                  src="https://cdn.higgsfield.ai/card/86d891a9-a5f1-4aa0-8ca1-4bfb8770e745.mp4"
                  poster="https://static.higgsfield.ai/contest/open-projects/cully-hill-boys-poster-3891-26951-20260807.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2.5 flex flex-col justify-between text-left">
                  <span className="text-[9px] bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full w-max uppercase tracking-wider shadow">
                    FEATURED
                  </span>
                  <div>
                    <div className="text-[11px] font-black text-white leading-tight uppercase tracking-wide drop-shadow">
                      THE CULLY HILL BOYS
                    </div>
                    <div className="text-[9px] font-semibold text-emerald-300">
                      ByteDance Seedance 2.5
                    </div>
                  </div>
                </div>

                {/* Explore Button on Hover (Exact Higgsfield SSR Match) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[10px] font-bold text-white flex items-center gap-1 shadow-lg transform translate-y-1 group-hover:translate-y-0 transition-transform">
                    <span>Explore</span>
                    <ExternalLink className="w-2.5 h-2.5 text-yellow-300" />
                  </div>
                </div>
              </div>

              {/* Right Card: Hell Grind */}
              <div className="w-28 sm:w-36 h-20 sm:h-24 rounded-2xl overflow-hidden relative border border-[#2b3345] shadow-lg opacity-75 scale-95 hover:opacity-100 hover:scale-100 transition-all duration-300 group cursor-pointer">
                <video
                  src="https://cdn.higgsfield.ai/card/e037e439-307d-415c-8fc4-86082fbb1382.mp4"
                  poster="https://static.higgsfield.ai/contest/open-projects/hell-grind-poster-3891-26952-20260807.webp"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-2 flex flex-col justify-end text-left">
                  <span className="text-[9px] font-black text-white uppercase tracking-wider truncate">
                    HELL GRIND
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase font-sans">
                BRING YOUR STORIES TO LIFE
              </h1>
              <p className="text-[11px] md:text-xs text-[#8e9aa8] max-w-lg mx-auto font-medium tracking-wide uppercase">
                CREATE MULTI-SCENE STORIES WITH CONSISTENT CHARACTERS, LOCATIONS, AND OBJECTS.
              </p>
            </div>
          </div>

          {/* Floating Generation Prompt Box (Strict Project Element Isolation) */}
          <PromptBox
            availableElements={activeView === 'home' ? globalElements : currentProject.elements}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            projectTitle={currentProject.title}
            hasPreviousShots={currentProject.assets.length > 0}
            initialPrompt={promptValue}
            initialElements={promptElements}
            onPromptChange={setPromptValue}
          />

          {/* Generation Error / Notice Banner (Never silently vanishes) */}
          {generationError && (
            <div className="w-full max-w-[840px] mx-auto p-4 rounded-2xl bg-[#1b1416] border border-red-500/40 flex items-start justify-between shadow-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-red-300">{generationError.title}</div>
                  <div className="text-[11px] text-[#e0b4b4] leading-relaxed">{generationError.message}</div>
                  {generationError.hint && (
                    <div className="text-[10px] text-yellow-300 font-mono mt-1 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20 inline-block">
                      💡 {generationError.hint}
                    </div>
                  )}
                  {generationError.taskId && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleRecoverTask(generationError.taskId!)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-medium border border-red-500/40 flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        Check Status & Load Video ({generationError.taskId})
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setGenerationError(null)}
                className="text-[#997777] hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0 ml-3"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Generation Progress Indicator Banner */}
          {isGenerating && (
            <div className="w-full max-w-[840px] mx-auto p-4 rounded-2xl bg-[#141922] border border-yellow-400/40 flex items-center justify-between shadow-2xl animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{generationStage}</div>
                  <div className="text-[11px] text-[#8692a3]">
                    BytePlus Seedance 2.5 Multimodal Engine • {elapsedSeconds}s elapsed
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-yellow-300 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                {elapsedSeconds}s
              </span>
            </div>
          )}

          {/* VIEW: HOME VIEW -> Projects Grid + Recent Generations */}
          {activeView === 'home' && (
            <div className="w-full max-w-[840px] mx-auto space-y-7">
              {/* My Projects Grid Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Film className="w-4 h-4 text-yellow-400" />
                    <span>My Projects ({projects.length})</span>
                  </div>
                  <button
                    onClick={() => handleCreateNewProject()}
                    className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Project</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Create New Project Card - Exact Higgsfield HTML SSR Match */}
                  <div 
                    onClick={() => handleCreateNewProject()}
                    className="h-44 rounded-[16px] border border-[rgba(197,197,197,0.30)] bg-white/5 shadow-[inset_0_-0.298px_5.356px_0_rgba(185,185,185,0.35)] hover:border-yellow-400/60 hover:bg-white/[0.08] flex flex-col items-center justify-center text-[#9eaab8] hover:text-white cursor-pointer transition-all duration-200 group"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#1e242e] border border-[#2b3342] group-hover:border-yellow-400/50 group-hover:bg-[#252c38] flex items-center justify-center mb-2.5 transition-all shadow-md">
                      <Plus className="w-5 h-5 text-[#8e9ba9] group-hover:text-yellow-400 transition" />
                    </div>
                    <span className="text-xs font-bold text-white tracking-wide">Create new project</span>
                    <span className="text-[10px] text-[#6a7788] mt-1">Clean canvas & independent elements</span>
                  </div>

                  {/* Existing Projects Cards */}
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleSelectProject(p.id);
                        setActiveView('project');
                      }}
                      className="h-44 rounded-[16px] bg-[#14181f] border border-[rgba(197,197,197,0.22)] shadow-[inset_0_-0.298px_5.356px_0_rgba(185,185,185,0.20)] hover:border-yellow-400/70 overflow-hidden relative group cursor-pointer transition-all duration-300 flex flex-col justify-between p-3.5"
                    >
                      <img
                        src={p.thumbnail}
                        alt={p.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-65"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1115] via-[#0e1115]/60 to-black/30 group-hover:from-[#0e1115]/95 transition-all" />

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-[10px] bg-black/70 backdrop-blur-md text-yellow-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-white/10 shadow">
                          {p.assets.length} Shots
                        </span>
                        <span className="text-[10px] bg-black/70 backdrop-blur-md text-[#cbd5e1] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border border-white/10 shadow">
                          <AtSign className="w-2.5 h-2.5 text-yellow-400" />
                          {p.elements.length} Elements
                        </span>
                      </div>

                      <div className="relative z-10 space-y-1">
                        <div className="font-bold text-sm text-white truncate drop-shadow">{p.title}</div>
                        <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
                          <span className="text-[#8492a5]">Private Studio</span>
                          <span className="text-yellow-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            Open <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Elements Library Banner */}
              <div className="p-4 rounded-2xl bg-[#13171e] border border-[#232a36] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <AtSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      Global Elements Library
                      <span className="text-[10px] bg-[#222938] text-yellow-300 px-2 py-0.5 rounded-full font-mono">
                        {globalElements.length} registered
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#7d8898]">
                      All characters, props, and locations created across your films are available globally.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsElementsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#202734] hover:bg-[#2b3445] text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Manage Elements</span>
                </button>
              </div>

              {/* Direct Home Chats Section */}
              {chats.length > 0 && (
                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <MessageSquare className="w-4 h-4 text-yellow-400" />
                      <span>Direct Home Chats ({chats.length})</span>
                    </div>
                    <span className="text-[11px] text-[#717d8e]">
                      Saved prompts generated from Home
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {chats.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectChat(c.id)}
                        className="h-44 rounded-[16px] bg-[#14181f] border border-[rgba(197,197,197,0.22)] shadow-[inset_0_-0.298px_5.356px_0_rgba(185,185,185,0.20)] hover:border-yellow-400/70 overflow-hidden relative group cursor-pointer transition-all duration-300 flex flex-col justify-between p-3.5"
                      >
                        {c.asset?.videoUrl ? (
                          <video
                            src={c.asset.videoUrl}
                            poster={c.asset.thumbnail}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-100"
                          />
                        ) : c.asset?.thumbnail ? (
                          <img
                            src={c.asset.thumbnail}
                            alt={c.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-65"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#161a22]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1115] via-[#0e1115]/60 to-black/30 group-hover:from-[#0e1115]/95 transition-all" />

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[10px] bg-black/70 backdrop-blur-md text-yellow-300 px-2.5 py-0.5 rounded-full font-mono font-bold border border-white/10 shadow flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" /> Video
                          </span>
                          <span className="text-[10px] bg-black/70 backdrop-blur-md text-[#cbd5e1] px-2.5 py-0.5 rounded-full font-semibold border border-white/10 shadow">
                            {c.createdAt}
                          </span>
                        </div>

                        <div className="relative z-10 space-y-1">
                          <div className="font-bold text-sm text-white truncate drop-shadow">{c.title}</div>
                          <div className="text-[11px] text-[#8ea0b4] line-clamp-1 truncate">
                            {c.prompt}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: PROJECT VIEW -> Dedicated Main Folder & Subfolder Hierarchy */}
          {activeView === 'project' && (
            <div className="w-full max-w-[840px] mx-auto space-y-4">
              {/* Project Header Bar */}
              <div className="flex items-center justify-between bg-[#13171e] border border-[#232936] p-3.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentProject.thumbnail} 
                    alt={currentProject.title} 
                    className="w-10 h-10 rounded-xl object-cover border border-[#2b3343]"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      {currentProject.title}
                      <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-400/30">
                        Active Studio
                      </span>
                    </h2>
                    <div className="flex items-center gap-2 text-[11px] text-[#7e8b9d] mt-0.5">
                      <span>{currentProject.assets.length} Generated Shots</span>
                      <span>•</span>
                      <span className="text-yellow-400">{currentProject.elements.length} Locked Elements</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsElementsModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#1e2532] hover:bg-[#283244] border border-[#2f3a4d] text-xs text-white font-semibold transition flex items-center gap-1.5"
                  >
                    <AtSign className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Project Elements ({currentProject.elements.length})</span>
                  </button>

                  <button
                    onClick={() => setIsBriefModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#1e2532] hover:bg-[#283244] border border-[#2f3a4d] text-xs text-white font-semibold transition"
                  >
                    Project Brief
                  </button>
                </div>
              </div>

              {/* Dedicated Project Main Folder & Subfolder Hierarchy Bar */}
              <div className="bg-[#12161f] border border-[#222938] rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#1f2633]">
                  {/* Dedicated Main Folder & Breadcrumb */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FolderTree className="w-4 h-4 text-yellow-400" />
                      <span>Dedicated Main Folder:</span>
                      <span className="text-yellow-400 font-mono bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                        📁 /{currentProject.dedicatedFolder || currentProject.title}
                      </span>
                    </div>
                    {/* Breadcrumb Path */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7d8b9e]">
                      <span>Projects</span>
                      <ChevronRight className="w-3 h-3 text-[#525f70]" />
                      <span className="text-white font-medium">{currentProject.title}</span>
                      <ChevronRight className="w-3 h-3 text-[#525f70]" />
                      <span className="text-yellow-300 font-semibold">
                        {activeFolder ? activeFolder.name : 'All assets'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Stats */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#717e90] bg-[#1a202c] px-2.5 py-1 rounded-lg border border-[#293244]">
                      Showing <strong className="text-white font-mono">{displayedProjectAssets.length}</strong> of <strong className="text-white font-mono">{currentProject.assets.length}</strong> shots
                    </span>
                    <button
                      onClick={() => {
                        const name = prompt(`Create new subfolder in "${currentProject.title}":`);
                        if (name) {
                          handleAddFolder(name, selectedFolderId !== 'all' ? selectedFolderId : null);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/30 text-yellow-300 text-xs font-semibold flex items-center gap-1 transition"
                      title="Add subfolder to this project"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Subfolder</span>
                    </button>
                  </div>
                </div>

                {/* Subfolder Chips Navigation */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                  {/* All assets pill */}
                  <button
                    onClick={() => setSelectedFolderId('all')}
                    className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      selectedFolderId === 'all'
                        ? 'bg-yellow-400 text-black shadow-md font-bold'
                        : 'bg-[#181e28] text-[#8ea0b5] hover:text-white hover:bg-[#202735] border border-[#283243]'
                    }`}
                  >
                    <Folder className="w-3 h-3" />
                    <span>All assets</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      selectedFolderId === 'all' ? 'bg-black/20 text-black' : 'bg-[#263042] text-[#9fb0c3]'
                    }`}>
                      {currentProject.assets.length}
                    </span>
                  </button>

                  {/* Individual subfolders */}
                  {currentProjectFolders.filter(f => f.id !== 'all').map(folder => {
                    const isSelected = selectedFolderId === folder.id;
                    const isNested = !!folder.parentId;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
                          isSelected
                            ? 'bg-white/10 text-white border-yellow-400/60 shadow-[0_0_12px_rgba(234,179,8,0.15)] font-semibold'
                            : 'bg-[#161c26] text-[#8696ab] hover:text-white hover:bg-[#1e2533] border-[#252f40]'
                        }`}
                      >
                        {isNested ? (
                          <CornerDownRight className="w-2.5 h-2.5 text-[#67778b]" />
                        ) : (
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: folder.color || '#eab308' }} 
                          />
                        )}
                        <span className="truncate max-w-[130px]">{folder.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-yellow-400/30 text-yellow-300' : 'bg-[#222a3a] text-[#8c9cae]'
                        }`}>
                          {folder.assetCount || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Project Timeline & Generations */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <span>Project Timeline & Generations</span>
                  <ChevronRight className="w-4 h-4 text-[#6c7684]" />
                  {selectedFolderId !== 'all' && (
                    <span className="text-xs text-yellow-400 font-mono font-medium">
                      in &apos;{activeFolder ? activeFolder.name : selectedFolderId}&apos;
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#717c8d]">
                  {displayedProjectAssets.length} Generated Shots
                </span>
              </div>

              {/* Assets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* "Create New Project" Card (Directly creates new project without replacing) */}
                <div 
                  onClick={() => handleCreateNewProject()}
                  className="h-48 rounded-2xl border-2 border-dashed border-[#242b37] hover:border-[#424f65] bg-[#111419]/50 flex flex-col items-center justify-center text-[#6e7b8d] hover:text-white cursor-pointer transition group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1b2029] group-hover:bg-[#252c38] flex items-center justify-center mb-2 transition">
                    <Plus className="w-5 h-5 group-hover:text-yellow-400 transition" />
                  </div>
                  <span className="text-xs font-semibold">Create new project</span>
                  <span className="text-[10px] text-[#556070] mt-0.5">Appends to projects</span>
                </div>

                {/* Project Assets */}
                {displayedProjectAssets.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 h-48 rounded-2xl bg-[#11141a] border border-[#222834] flex flex-col items-center justify-center text-center p-4">
                    <Film className="w-8 h-8 text-[#546274] mb-2" />
                    <span className="text-xs font-bold text-white">
                      {selectedFolderId !== 'all'
                        ? `No shots in folder "${activeFolder ? activeFolder.name : selectedFolderId}"`
                        : 'No video shots in this project yet'}
                    </span>
                    <p className="text-[11px] text-[#717d8e] mt-1 max-w-xs">
                      {selectedFolderId !== 'all'
                        ? 'Generate a shot above to save directly into this subfolder, or switch to "All assets".'
                        : 'Type your scene prompt above and click GENERATE to render your first Seedance 2.5 shot.'}
                    </p>
                    {selectedFolderId !== 'all' && (
                      <button
                        onClick={() => setSelectedFolderId('all')}
                        className="mt-2.5 px-3 py-1 rounded-lg bg-[#1e2533] hover:bg-[#283244] text-xs text-yellow-300 font-medium transition"
                      >
                        View All Assets
                      </button>
                    )}
                  </div>
                ) : (
                  displayedProjectAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="h-48 rounded-2xl bg-[#14181f] border border-[#232936] hover:border-yellow-400/60 overflow-hidden relative group cursor-pointer shadow-lg transition-all duration-200 flex flex-col justify-end p-3"
                    >
                      {/* Background Video or Thumbnail (Play on hover to save GPU decoders & bandwidth) */}
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
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img
                          src={asset.thumbnail}
                          alt={asset.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 group-hover:from-black/95 transition-all" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 z-10">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-yellow-300 px-2 py-0.5 rounded border border-white/10">
                          {asset.model}
                        </span>
                        <span className="text-[10px] font-mono font-semibold bg-black/75 backdrop-blur-md text-white px-1.5 py-0.5 rounded border border-white/10">
                          {asset.duration}
                        </span>
                      </div>

                      {/* Subfolder Path Badge */}
                      <div className="absolute top-9 left-2.5 z-10">
                        <div className="text-[9px] font-medium bg-black/85 backdrop-blur-md text-[#d1d5db] border border-white/10 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm max-w-[200px] truncate">
                          <Folder className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
                          <span className="truncate">{asset.folderPath || getFolderPath(currentProjectFolders, asset.folderId || 'renders') || 'Renders & Masters'}</span>
                        </div>
                      </div>

                      {/* Director Camera Move Badge */}
                      {asset.cameraMovement && (
                        <div className="absolute top-16 left-2.5 z-10">
                          <div className="text-[9px] font-mono font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/35 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                            <Camera className="w-2.5 h-2.5 text-yellow-400" />
                            <span>{asset.cameraMovement}</span>
                          </div>
                        </div>
                      )}

                      {/* Bottom Video Meta & Move to Subfolder action */}
                      <div className="relative z-10 space-y-1 pt-1">
                        <div className="font-bold text-xs text-white truncate drop-shadow">{asset.title}</div>
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 text-[#cbd2dc]">
                            <span>{asset.resolution}</span>
                            <span>•</span>
                            <span className="text-yellow-400 font-semibold">{(asset.elementsUsed || []).length} Props</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Reopen & Revise in Video Editor */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAsset(asset);
                                setSelectedTool('editor');
                              }}
                              className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-semibold text-[9px] transition flex items-center gap-0.5"
                              title="Reopen and revise video in Video Editor"
                            >
                              <Scissors className="w-2.5 h-2.5 text-blue-400" />
                              <span>Edit</span>
                            </button>

                            {/* Extend Shot into Sequel */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const sequelPrompt = `${asset.prompt} [Sequel: Continuous multi-shot continuation preserving character state and lighting]`;
                                setPromptValue(sequelPrompt);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2 py-0.5 rounded bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-300 border border-yellow-400/30 font-semibold text-[9px] transition"
                              title="Extend this shot into next sequence"
                            >
                              Extend
                            </button>

                            {/* Quick Move to Subfolder dropdown */}
                            <div 
                              className="relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={asset.folderId || 'renders'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleMoveAsset(asset.id, e.target.value);
                                }}
                                className="bg-black/80 hover:bg-[#1a212e] text-[#94a3b8] hover:text-white border border-[#2f394a] rounded px-1.5 py-0.5 text-[9px] font-medium cursor-pointer transition focus:outline-none focus:border-yellow-400"
                                title="Move video to subfolder"
                              >
                                {currentProjectFolders.filter(f => f.id !== 'all').map(folder => (
                                  <option key={folder.id} value={folder.id} className="bg-[#12161f] text-white">
                                    {folder.parentId ? `  ↳ ${folder.name}` : `📁 ${folder.name}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
        )}
      </div>

      {/* Elements Library Modal (Clean Project Elements or Global Elements) */}
      <ElementsModal
        isOpen={isElementsModalOpen}
        onClose={() => setIsElementsModalOpen(false)}
        title={activeView === 'home' ? 'Global Elements' : `${currentProject.title} — Elements Library`}
        elements={activeView === 'home' ? globalElements : currentProject.elements}
        allGlobalElements={[]}
        allowImportGlobal={false}
        onAddElement={handleAddElement}
        onDeleteElement={handleDeleteElement}
        onLinkGlobalElement={handleLinkGlobalElement}
      />

      {/* Project Brief Modal */}
      <ProjectBriefModal
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
        projectTitle={currentProject.title}
        initialBrief={currentProject.brief}
        onSaveBrief={(newBrief) => {
          const updated = projects.map(p => p.id === currentProject.id ? { ...p, brief: newBrief } : p);
          persistProjects(updated);
        }}
      />

      {/* Fullscreen Video Player Modal */}
      <VideoPlayerModal
        asset={selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />

      {/* BytePlus ModelArk Token & Quota Manager Modal */}
      <TokenManagerModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        tokenBalance={tokenBalance}
        totalTokensUsed={totalTokensUsed}
        trialQuota={trialQuota}
        onUpdateBalance={handleUpdateBalance}
        onUpdateTrial={handleUpdateTrial}
        onRefreshLive={fetchLiveTokens}
      />
    </div>
  );
}
