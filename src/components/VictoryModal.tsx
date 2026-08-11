import React, { useEffect, useRef } from 'react';
import { Trophy, Download, ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import { PixelArtwork } from '../types';

interface VictoryModalProps {
  isOpen: boolean;
  artwork: PixelArtwork;
  onNextArtwork: () => void;
  onBackToGallery: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  artwork,
  onNextArtwork,
  onBackToGallery,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render high-res final artwork on modal canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const exportSize = 320;
    canvas.width = exportSize;
    canvas.height = exportSize;

    const cellW = exportSize / artwork.width;
    const cellH = exportSize / artwork.height;

    const paletteMap = new Map<number, string>();
    artwork.palette.forEach((p) => paletteMap.set(p.id, p.hex));

    const isDark = document.documentElement.classList.contains('dark');
    const isCustomImage = artwork.category === 'Custom Upload';
    ctx.fillStyle = !isCustomImage ? (isDark ? '#D4D4D8' : '#FFFFFF') : '#EAE6DF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    for (let r = 0; r < artwork.height; r++) {
      for (let c = 0; c < artwork.width; c++) {
        const colorId = artwork.grid[r][c];
        if (colorId > 0) {
          ctx.fillStyle = paletteMap.get(colorId) || '#A8A29E';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        } else if (!isCustomImage) {
          ctx.fillStyle = isDark ? '#D4D4D8' : '#FFFFFF';
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
        }
      }
    }
  }, [isOpen, artwork]);

  // Confetti particles loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];
    const colors = ['#D97706', '#57534E', '#15803D', '#2563EB', '#B45309', '#78350F'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 50,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.8) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      });
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity

        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  // Download High Res PNG
  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    const scale = 32; // 32px per pixel cell
    canvas.width = artwork.width * scale;
    canvas.height = artwork.height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paletteMap = new Map<number, string>();
    artwork.palette.forEach((p) => paletteMap.set(p.id, p.hex));

    const isDark = document.documentElement.classList.contains('dark');
    const isCustomImage = artwork.category === 'Custom Upload';
    ctx.fillStyle = !isCustomImage ? (isDark ? '#D4D4D8' : '#FFFFFF') : '#EAE6DF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < artwork.height; r++) {
      for (let c = 0; c < artwork.width; c++) {
        const colorId = artwork.grid[r][c];
        if (colorId > 0) {
          ctx.fillStyle = paletteMap.get(colorId) || '#A8A29E';
          ctx.fillRect(c * scale, r * scale, scale, scale);
        } else if (!isCustomImage) {
          ctx.fillStyle = isDark ? '#D4D4D8' : '#FFFFFF';
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artwork.title.toLowerCase().replace(/\s+/g, '_')}_pixel_art.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      
      {/* Confetti Background Canvas */}
      <canvas ref={confettiCanvasRef} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-xl p-6 text-stone-800 dark:text-zinc-100 text-center space-y-6">
        
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 p-0.5 mx-auto shadow-xs flex items-center justify-center animate-bounce">
          <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-stone-900 dark:text-zinc-100 flex items-center justify-center gap-2">
            <span>Artwork Completed!</span>
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </h2>
          <p className="text-sm text-stone-600 dark:text-zinc-400 font-medium">{artwork.title}</p>
        </div>

        {/* Preview Canvas */}
        <div className="p-3 bg-stone-100 dark:bg-zinc-800 rounded-2xl border border-stone-200 dark:border-zinc-700 inline-block shadow-inner">
          <canvas ref={canvasRef} className="w-48 h-48 rounded-xl object-contain shadow-xs mx-auto" />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-zinc-800">
          <button
            onClick={handleDownloadPng}
            className="w-full py-2.5 bg-[#967259] dark:bg-zinc-100 hover:bg-[#805D46] dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onNextArtwork}
              className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-semibold text-xs rounded-xl border border-stone-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Next Puzzle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onBackToGallery}
              className="py-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-semibold text-xs rounded-xl border border-stone-200 dark:border-zinc-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
