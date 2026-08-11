import { ColorPaletteItem } from '../types';

export interface PaletteTheme {
  id: string;
  name: string;
  description: string;
}

export const PALETTE_THEMES: PaletteTheme[] = [
  { id: 'original', name: 'Original', description: 'Default template colors' },
  { id: 'grayscale', name: 'Shades of Grey', description: 'Monochrome shades of dark & light grey' },
  { id: 'pastel', name: 'Pastel Dreams', description: 'Soft, calming pastel hues' },
  { id: 'neon', name: 'Vivid Neon', description: 'High-contrast cyberpunk neon' },
  { id: 'autumn', name: 'Autumn Warmth', description: 'Cozy terracotta, amber, & warm neutrals' },
  { id: 'ocean', name: 'Ocean Breeze', description: 'Serene blues, aquas, & coastal teals' },
  { id: 'vintage', name: 'Vintage Sepia', description: 'Nostalgic retro warm monochrome' },
];

// Helper to remap a palette array into a target palette theme
export function applyPaletteTheme(originalPalette: ColorPaletteItem[], themeId: string): ColorPaletteItem[] {
  if (themeId === 'original') return originalPalette;

  const count = originalPalette.length;

  return originalPalette.map((item, idx) => {
    const t = count > 1 ? idx / (count - 1) : 0.5;
    let newHex = item.hex;

    switch (themeId) {
      case 'grayscale': {
        // Pure shades of grey and light grey from charcoal (15% lightness) to light grey (90% lightness)
        const lightness = 15 + t * 75;
        newHex = hslToHex(0, 0, lightness);
        break;
      }
      case 'pastel': {
        // Map to soft pastel spectrum
        const hue = (idx * 360 / count) % 360;
        newHex = hslToHex(hue, 65, 75);
        break;
      }
      case 'neon': {
        // High saturation vibrant colors
        const hue = (idx * 360 / count + 40) % 360;
        newHex = hslToHex(hue, 95, 55);
        break;
      }
      case 'autumn': {
        // Warm amber, orange, terracotta, deep brown
        const hue = 15 + t * 45; // 15deg (red-orange) to 60deg (yellow-gold)
        const lightness = 25 + t * 50;
        newHex = hslToHex(hue, 80, lightness);
        break;
      }
      case 'ocean': {
        // Deep blue to cyan ice
        const hue = 180 + t * 60; // 180deg (teal) to 240deg (deep blue)
        const lightness = 30 + t * 50;
        newHex = hslToHex(hue, 85, lightness);
        break;
      }
      case 'vintage': {
        // Sepia tones
        const lightness = 20 + t * 65;
        newHex = hslToHex(35, 45, lightness);
        break;
      }
      default:
        newHex = item.hex;
    }

    return {
      ...item,
      hex: newHex,
    };
  });
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
