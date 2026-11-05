import { ProjectFolder, GeneratedAsset } from '@/types';

/**
 * Returns a standard cinematic hierarchy of subfolders and nested subfolders
 * for any project, ensuring uniform, professional folder architecture.
 */
export function getDefaultProjectFolders(projectTitle: string = 'Project'): ProjectFolder[] {
  return [
    {
      id: 'all',
      name: 'All assets',
      parentId: null,
      category: 'all',
      color: '#cbd5e1',
      assetCount: 0,
    },
    {
      id: 'renders',
      name: 'Renders & Masters',
      parentId: null,
      category: 'renders',
      color: '#eab308', // Gold
      assetCount: 0,
    },
    {
      id: 'renders-1080p',
      name: '1080p Final Cuts',
      parentId: 'renders',
      category: 'renders',
      color: '#06b6d4', // Cyan
      assetCount: 0,
    },
    {
      id: 'renders-720p',
      name: '720p Fast Previews',
      parentId: 'renders',
      category: 'renders',
      color: '#10b981', // Emerald
      assetCount: 0,
    },
    {
      id: 'scenes',
      name: 'Scenes & Sequences',
      parentId: null,
      category: 'scenes',
      color: '#a855f7', // Purple
      assetCount: 0,
    },
    {
      id: 'scenes-act1',
      name: 'Act 1 - Intro',
      parentId: 'scenes',
      category: 'scenes',
      color: '#c084fc', // Light purple
      assetCount: 0,
    },
    {
      id: 'scenes-act2',
      name: 'Act 2 - Product Showcase',
      parentId: 'scenes',
      category: 'scenes',
      color: '#c084fc',
      assetCount: 0,
    },
    {
      id: 'scenes-act3',
      name: 'Act 3 - Logo Reveal',
      parentId: 'scenes',
      category: 'scenes',
      color: '#c084fc',
      assetCount: 0,
    },
    {
      id: 'drafts',
      name: 'Drafts & Experiments',
      parentId: null,
      category: 'drafts',
      color: '#94a3b8', // Slate
      assetCount: 0,
    },
    {
      id: 'drafts-prompts',
      name: 'Prompt Iterations',
      parentId: 'drafts',
      category: 'drafts',
      color: '#cbd5e1',
      assetCount: 0,
    },
    {
      id: 'elements-tests',
      name: 'Character & Prop Locks',
      parentId: null,
      category: 'elements',
      color: '#f43f5e', // Rose
      assetCount: 0,
    },
  ];
}

export interface FolderNode extends ProjectFolder {
  children: FolderNode[];
  level: number;
}

/**
 * Builds a hierarchical tree from flat folder array
 */
export function buildFolderTree(folders: ProjectFolder[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>();
  
  // Initialize nodes
  folders.forEach(f => {
    folderMap.set(f.id, { ...f, children: [], level: 0 });
  });

  const roots: FolderNode[] = [];

  folders.forEach(f => {
    const node = folderMap.get(f.id);
    if (!node) return;

    if (f.parentId && folderMap.has(f.parentId)) {
      const parent = folderMap.get(f.parentId)!;
      node.level = (parent.level || 0) + 1;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Gets human-readable path string for a given folder id
 * e.g. "Renders & Masters / 1080p Final Cuts"
 */
export function getFolderPath(folders: ProjectFolder[], folderId: string): string {
  if (folderId === 'all') return 'All Assets';
  const target = folders.find(f => f.id === folderId);
  if (!target) return 'Root';

  if (!target.parentId) return target.name;

  const parent = folders.find(f => f.id === target.parentId);
  if (parent) {
    return `${parent.name} / ${target.name}`;
  }

  return target.name;
}

/**
 * Calculates video asset counts for each folder, including nested subfolders
 */
export function updateFolderAssetCounts(folders: ProjectFolder[], assets: GeneratedAsset[]): ProjectFolder[] {
  return folders.map(folder => {
    if (folder.id === 'all') {
      return { ...folder, assetCount: assets.length };
    }

    // Direct assets in this folder
    const directCount = assets.filter(a => a.folderId === folder.id).length;

    // Assets in subfolders where parentId === folder.id
    const childFolderIds = folders.filter(f => f.parentId === folder.id).map(f => f.id);
    const nestedCount = assets.filter(a => a.folderId && childFolderIds.includes(a.folderId)).length;

    return {
      ...folder,
      assetCount: directCount + nestedCount,
    };
  });
}
