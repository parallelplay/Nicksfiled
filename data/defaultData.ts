import { Project, ElementReference, DirectChat } from '@/types';
import { getDefaultProjectFolders } from '@/lib/folderUtils';

export const initialGlobalElements: ElementReference[] = [
  {
    id: 'prop-glasses',
    name: 'SeeIt Smart Glasses',
    tag: '@prop_seeit-glasses',
    category: 'prop',
    thumbnail: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
    description: 'Thick high-gloss black acetate frame, panto lenses, miniature camera lens module with thin silver ring in upper-outer corner, microphone pinhole on nose bridge.',
    referenceImages: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1080&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'char-kabir-01',
    name: 'Kabir (Official Model)',
    tag: '@char_kabir01',
    category: 'character',
    thumbnail: '/characters/kabir/kabir_face_front.jpg',
    description: 'Kabir: 25-year-old South Asian man with thick wavy voluminous dark brown hair, sharp jawline, light well-groomed stubble, warm hazel eyes, confident expression. Wearing an olive-green overshirt open over a white crewneck t-shirt, indigo jeans, and a black sling backpack.',
    referenceImages: [
      '/characters/kabir/kabir_face_front.jpg',
      '/characters/kabir/kabir_face_angle.jpg',
    ],
  },
  {
    id: 'char-kabir',
    name: 'Kabir',
    tag: '@char_kabir04',
    category: 'character',
    thumbnail: '/characters/kabir/kabir_face_front.jpg',
    description: 'Kabir: 25-year-old South Asian man with thick wavy voluminous dark brown hair, sharp jawline, light well-groomed stubble, warm hazel eyes, confident expression. Wearing an olive-green overshirt open over a white crewneck t-shirt, indigo jeans, and a black sling backpack.',
    referenceImages: [
      '/characters/kabir/kabir_face_front.jpg',
      '/characters/kabir/kabir_face_angle.jpg',
    ],
  },
  {
    id: 'char-lady-v1',
    name: 'Lady (Vogue High-Jewelry Model)',
    tag: '@char_lady_v1',
    category: 'character',
    thumbnail: '/characters/lady/lady_original.png',
    description: 'Lady: Elegant South Asian / Indian high-fashion luxury model with delicate facial structure, warm almond-brown eyes, sculpted cheekbones, full lips, and wet-look slicked-back dark hair. Wearing a dramatic black ruffled organza off-shoulder gown with scalloped plunging neckline.',
    referenceImages: [
      '/characters/lady/lady_model_sheet.jpg',
    ],
  },
  {
    id: 'loc-campsite',
    name: 'Night Campsite',
    tag: '@loc_night-campsite',
    category: 'location',
    thumbnail: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80',
    description: 'Lush mountain forest clearing at dusk with glowing orange illuminated camping tents, campfire embers, warm ambient rim light.',
    referenceImages: [
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1080&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'prop-watch',
    name: 'Titanium Smartwatch',
    tag: '@prop_smartwatch',
    category: 'prop',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    description: 'Matte titanium circular casing with dark fluoropolymer strap worn exclusively on left wrist.',
    referenceImages: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1080&auto=format&fit=crop&q=80',
    ],
  },
];

export const initialProjects: Project[] = [
  {
    id: '594b72c0-6bff-4b74-bc3f-62524814c45b',
    title: 'SEE IT',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80',
    isPrivate: true,
    brief: `# Project: SEE IT (AI Commercial)

## Vision
A high-energy, premium tech commercial showcasing next-generation 'SeeIt AI' smart spectacles worn by Kabir. 

## Key Rules & Aesthetic Lock
- **Color Grade:** Cinematic teal & amber with deep blacks and sharp neon street reflections.
- **Motion:** Steadycam tracking and slow cinematic dolly zooms.
- **Props Consistency:** The glasses (@prop_seeit-glasses) must strictly preserve shape, clear lenses, camera pinhole, and right-arm button across every single shot.
- **Character:** Kabir (@char_kabir04) must maintain exact facial features, stubble, and green utility jacket.`,
    elements: [], // Clean and empty by default per user request
    dedicatedFolder: 'SEE IT',
    folders: getDefaultProjectFolders('SEE IT'),
    assets: [], // Clean canvas - all old videos removed!
  },
];

export const initialProject: Project = initialProjects[0];

export const initialDirectChats: DirectChat[] = [];

