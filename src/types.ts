export interface ColorPaletteItem {
  id: number; // 1-based color index (0 is transparent / empty background)
  hex: string;
  name: string;
}

export interface PixelArtwork {
  id: string;
  title: string;
  category: 'Animals' | 'Anime' | 'Famous Art' | 'Food' | 'Fantasy' | 'Nature' | 'Pop Culture' | 'AI Generated' | 'Custom Upload';
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  width: number;
  height: number;
  palette: ColorPaletteItem[];
  grid: number[][]; // 2D array [row][col] containing color IDs (0 or 1..N)
  isUserCreated?: boolean;
  createdAt?: number;
}

export type ToolType = 'brush' | 'bucket' | 'eraser' | 'magic_wand' | 'eyedropper';

export interface SavedProgress {
  paintedGrid: number[][]; // 0 = unpainted, >0 = color ID painted
  isCompleted: boolean;
  timeSpentSeconds: number;
  lastModified: number;
  history?: number[][][]; // for undo stack
}

export interface GeneratorParams {
  prompt: string;
  gridSize: 16 | 24 | 32;
  colorCount: number;
  category?: string;
}
