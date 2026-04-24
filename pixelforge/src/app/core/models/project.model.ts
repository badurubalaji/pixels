export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
  canvasJson?: string;
  tags?: string[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  layers: Layer[];
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;
  order: number;
  data: Record<string, unknown>;
}

export enum LayerType {
  Image = 'image',
  Text = 'text',
  Shape = 'shape',
  Background = 'background',
}

export interface ExportOptions {
  format: 'png' | 'webp' | 'svg' | 'jpeg';
  quality: number;
  width: number;
  height: number;
  transparent: boolean;
}

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
  category: string;
}

export const CANVAS_PRESETS: CanvasPreset[] = [
  { name: 'Logo (Square)', width: 1000, height: 1000, category: 'Logo' },
  { name: 'Logo (Wide)', width: 1500, height: 500, category: 'Logo' },
  { name: 'HD', width: 1920, height: 1080, category: 'Standard' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'Standard' },
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'Social' },
  { name: 'Facebook Cover', width: 820, height: 312, category: 'Social' },
  { name: 'Twitter Header', width: 1500, height: 500, category: 'Social' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social' },
];
