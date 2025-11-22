export const DEFAULT_THEME: 'light' | 'dark' = 'light';
export const DEFAULT_STROKE_COLOR = '#111827';
export const DEFAULT_STROKE_WIDTH = 4;
export const DEFAULT_ZOOM = 1;
export const DEFAULT_FPS = 60;
export const CANVAS_PADDING = 16;
export const VIDEO_BITRATE = 4_000_000;

export const COLOR_PALETTE = [
  '#111827',
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ffffff',
  '#000000'
];

export const SITE_CONFIG = {
  name: 'sac - Signature Animation Creator',
  shortName: 'sac',
  description: 'Create stunning animated signatures with ease. Draw your signature, preview the animated reveal, and export in multiple formats including SVG, MP4, and Lottie JSON.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sac.jayanithu.dev',
  author: {
    name: 'Jayanithu',
    github: 'https://github.com/Jayanithu',
    linkedin: 'https://www.linkedin.com/in/jayanithu-perera-ba7a46264/',
    twitter: 'https://x.com/Jayaniithu'
  }
};

export const LOTTIE_VERSION = '5.7.4';

