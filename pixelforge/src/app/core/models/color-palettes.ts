export interface ColorPalette {
  name: string;
  colors: string[];
}

export const BRAND_PALETTES: ColorPalette[] = [
  {
    name: 'Professional',
    colors: ['#2c3e50', '#3498db', '#ecf0f1', '#e74c3c', '#1abc9c', '#f39c12'],
  },
  {
    name: 'Modern',
    colors: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483', '#0ea5e9'],
  },
  {
    name: 'Nature',
    colors: ['#2d5016', '#4a7c3f', '#8bc34a', '#ffeb3b', '#795548', '#3e2723'],
  },
  {
    name: 'Sunset',
    colors: ['#ff6b6b', '#ee5a24', '#f0932b', '#ffbe76', '#6c5ce7', '#a29bfe'],
  },
  {
    name: 'Ocean',
    colors: ['#0c2461', '#1e3799', '#4a69bd', '#6a89cc', '#82ccdd', '#b8e994'],
  },
  {
    name: 'Minimal',
    colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'],
  },
  {
    name: 'Vibrant',
    colors: ['#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ff9800', '#f44336'],
  },
  {
    name: 'Pastel',
    colors: ['#fce4ec', '#e8eaf6', '#e0f2f1', '#fff9c4', '#fbe9e7', '#f3e5f5'],
  },
  {
    name: 'Tech',
    colors: ['#00d2ff', '#7b2ff7', '#ff0844', '#00c853', '#304ffe', '#ffab00'],
  },
  {
    name: 'Corporate',
    colors: ['#1b2838', '#2a475e', '#66c0f4', '#c7d5e0', '#171a21', '#b8b6b4'],
  },
];
