export type ElementCategory = 'character' | 'location' | 'prop';

export interface ElementReference {
  id: string;
  name: string;
  tag: string; // e.g., "@char_kabir04", "@loc_temple", "@prop_necklace"
  category: ElementCategory;
  thumbnail: string;
  description: string;
  referenceImages: string[];
  projectId?: string;        // Dedicated project link (Strict project separation)
  projectTitle?: string;     // Dedicated project title
}

export interface ProjectFolder {
  id: string;
  name: string;
  parentId?: string | null; // For nested hierarchy & subfolders
  category?: 'all' | 'renders' | 'scenes' | 'shots' | 'drafts' | 'elements' | 'custom';
  color?: string;
  assetCount?: number;
}

export interface GeneratedAsset {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail: string;
  prompt: string;
  duration: string;
  aspectRatio: string;
  resolution: string;
  model: string;
  createdAt: string;
  elementsUsed: string[];
  tokensUsed?: number;
  projectId?: string;        // Dedicated project link
  projectTitle?: string;     // Project name for display in Common
  folderId?: string;         // Subfolder / nested subfolder where it resides
  folderPath?: string;       // e.g. "Renders & Masters / 1080p Final Cuts"
  category?: string;         // e.g. "1080p Master", "Scene Shot"
  cameraMovement?: string;   // e.g. "360 Orbit", "FPV Drone Chase", "Slow Zoom In"
  opticalLook?: string;      // e.g. "Anamorphic 2.39:1", "Warm 35mm Halation"
  lightingStyle?: string;    // e.g. "Golden Hour", "Cyberpunk Neon"
  firstFrameImage?: string;  // Start-frame keyframe image condition
  motionStrength?: number;   // 1 to 10
  originalAssetId?: string;  // If edited from a previous video
  version?: string;          // e.g. "v2 - Edited"
  editNotes?: string;        // Notes on what was revised
}

export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  isPrivate: boolean;
  brief: string;
  elements: ElementReference[];
  folders: ProjectFolder[];
  assets: GeneratedAsset[];
  slug?: string;
  dedicatedFolder?: string; // Dedicated main project folder name
}

export interface DirectChat {
  id: string;
  title: string;
  prompt: string;
  asset?: GeneratedAsset;
  elementsUsed: ElementReference[];
  createdAt: string;
}

export interface TrialQuota {
  enabled: boolean;
  totalLimit: number;
  remaining: number;
  used: number;
  source?: string;
  status?: string;
  expiresAt?: string;
}

