import { ColorPaletteItem, PixelArtwork } from '../types';
import { centerArtworkGrid } from './gridUtils';

// Convert hex to RGB tuple
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// Convert RGB tuple to hex string
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
}

// Color distance formula
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const dr = rgb1[0] - rgb2[0];
  const dg = rgb1[1] - rgb2[1];
  const db = rgb1[2] - rgb2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Name colors based on standard palette names
function getNearestColorName(hex: string): string {
  const colorNames: { name: string; hex: string }[] = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Crimson', hex: '#DC2626' },
    { name: 'Dark Red', hex: '#991B1B' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Yellow', hex: '#EAB308' },
    { name: 'Lime', hex: '#84CC16' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Dark Green', hex: '#15803D' },
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Teal', hex: '#14B8A6' },
    { name: 'Cyan', hex: '#06B6D4' },
    { name: 'Sky Blue', hex: '#0EA5E9' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Magenta', hex: '#D946EF' },
    { name: 'Pink', hex: '#EC4899' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Brown', hex: '#854D0E' },
    { name: 'Saddle Brown', hex: '#78350F' },
    { name: 'Beige / Peach', hex: '#FDBA74' },
    { name: 'Light Cream', hex: '#FEF3C7' },
    { name: 'White / Pearl', hex: '#F8FAFC' },
    { name: 'Light Gray', hex: '#CBD5E1' },
    { name: 'Gray', hex: '#64748B' },
    { name: 'Dark Gray', hex: '#334155' },
    { name: 'Black / Charcoal', hex: '#0F172A' },
  ];

  const targetRgb = hexToRgb(hex);
  let minDistance = Infinity;
  let closestName = 'Custom Color';

  for (const c of colorNames) {
    const dist = colorDistance(targetRgb, hexToRgb(c.hex));
    if (dist < minDistance) {
      minDistance = dist;
      closestName = c.name;
    }
  }

  return closestName;
}

export async function convertImageToPixelArt(
  file: File,
  targetWidth: number,
  targetHeight: number,
  maxColors: number = 10,
  title: string = 'My Custom Photo',
  cropSquare: boolean = false
): Promise<PixelArtwork> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));

    img.onload = () => {
      // Create offscreen canvas for downscaling
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // Draw resized image
      ctx.imageSmoothingEnabled = false; // pixelated look
      
      if (cropSquare && img.naturalWidth && img.naturalHeight) {
        // Center crop to 1:1 before drawing to square target
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetWidth, targetHeight);
      } else {
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      }

      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imageData.data;

      // Extract raw RGB pixels
      const pixels: [number, number, number, number][] = []; // r, g, b, alpha
      for (let i = 0; i < data.length; i += 4) {
        pixels.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
      }

      // K-Means clustering for color quantization
      const solidPixels = pixels.filter(p => p[3] > 128); // filter non-transparent
      if (solidPixels.length === 0) {
        reject(new Error('Image appears to be completely transparent.'));
        return;
      }

      // Initialize K centroids randomly from solid pixels
      let centroids: [number, number, number][] = [];
      const step = Math.max(1, Math.floor(solidPixels.length / maxColors));
      for (let i = 0; i < maxColors && i * step < solidPixels.length; i++) {
        const p = solidPixels[i * step];
        centroids.push([p[0], p[1], p[2]]);
      }

      // Run 8 iterations of k-means
      for (let iter = 0; iter < 8; iter++) {
        const clusters: [number, number, number][][] = Array.from({ length: centroids.length }, () => []);

        for (const p of solidPixels) {
          const rgb: [number, number, number] = [p[0], p[1], p[2]];
          let minDist = Infinity;
          let bestCluster = 0;

          centroids.forEach((c, idx) => {
            const dist = colorDistance(rgb, c);
            if (dist < minDist) {
              minDist = dist;
              bestCluster = idx;
            }
          });

          clusters[bestCluster].push(rgb);
        }

        // Recompute centroids
        centroids = clusters.map((cl, idx) => {
          if (cl.length === 0) return centroids[idx];
          const sum = cl.reduce((acc, curr) => [acc[0] + curr[0], acc[1] + curr[1], acc[2] + curr[2]], [0, 0, 0]);
          return [
            Math.round(sum[0] / cl.length),
            Math.round(sum[1] / cl.length),
            Math.round(sum[2] / cl.length),
          ];
        });
      }

      // Filter duplicate/very close centroids
      const uniqueCentroids: [number, number, number][] = [];
      centroids.forEach(c => {
        if (!uniqueCentroids.some(uc => colorDistance(uc, c) < 15)) {
          uniqueCentroids.push(c);
        }
      });

      // Build ColorPaletteItem list (1-indexed)
      const palette: ColorPaletteItem[] = uniqueCentroids.map((c, idx) => {
        const hex = rgbToHex(c[0], c[1], c[2]);
        return {
          id: idx + 1,
          hex,
          name: `${getNearestColorName(hex)} #${idx + 1}`
        };
      });

      // Map each cell in 2D grid to nearest palette color ID or 0 if transparent
      const grid: number[][] = [];
      let pixelIdx = 0;

      for (let row = 0; row < targetHeight; row++) {
        const gridRow: number[] = [];
        for (let col = 0; col < targetWidth; col++) {
          const p = pixels[pixelIdx++];
          if (p[3] < 128) {
            gridRow.push(0); // transparent background
          } else {
            const rgb: [number, number, number] = [p[0], p[1], p[2]];
            let minDist = Infinity;
            let bestPaletteId = 1;

            palette.forEach(item => {
              const itemRgb = hexToRgb(item.hex);
              const dist = colorDistance(rgb, itemRgb);
              if (dist < minDist) {
                minDist = dist;
                bestPaletteId = item.id;
              }
            });

            gridRow.push(bestPaletteId);
          }
        }
        grid.push(gridRow);
      }

      const maxDim = Math.max(targetWidth, targetHeight);
      const difficulty = maxDim <= 16 ? 'Easy' : maxDim <= 28 ? 'Medium' : maxDim <= 48 ? 'Hard' : 'Expert';

      const artwork: PixelArtwork = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title || 'Custom Photo Puzzle',
        category: 'Custom Upload',
        difficulty,
        width: targetWidth,
        height: targetHeight,
        palette,
        grid: centerArtworkGrid(grid),
        isUserCreated: true,
        createdAt: Date.now(),
      };

      resolve(artwork);
    };

    reader.readAsDataURL(file);
  });
}
