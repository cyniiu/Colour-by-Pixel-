import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PixelArtwork, ColorPaletteItem, ToolType } from '../types';
import { soundManager } from '../utils/sound';

interface PixelCanvasProps {
  artwork: PixelArtwork;
  paintedGrid: number[][];
  setPaintedGrid: React.Dispatch<React.SetStateAction<number[][]>>;
  selectedColorId: number;
  setSelectedColorId: (id: number) => void;
  selectedTool: ToolType;
  onRecordHistory: (grid: number[][]) => void;
  zoomScale: number;
  setZoomScale: React.Dispatch<React.SetStateAction<number>>;
  onCompleteArtwork: () => void;
}

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
  artwork,
  paintedGrid,
  setPaintedGrid,
  selectedColorId,
  setSelectedColorId,
  selectedTool,
  onRecordHistory,
  zoomScale,
  setZoomScale,
  onCompleteArtwork,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan Offset
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Paint dragging state
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [lastPaintedCell, setLastPaintedCell] = useState<{ r: number; c: number } | null>(null);

  const width = artwork.width;
  const height = artwork.height;
  const paletteMap = useRef<Map<number, string>>(new Map());

  // Update palette map
  useEffect(() => {
    const map = new Map<number, string>();
    artwork.palette.forEach((p) => map.set(p.id, p.hex));
    paletteMap.current = map;
  }, [artwork.palette]);

  // Reset pan and zoom on artwork load
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.0);
  }, [artwork.id, setZoomScale]);

  // Check if color or entire artwork is complete
  const checkCompletion = useCallback((gridToCheck: number[][]) => {
    let totalUnpainted = 0;
    let selectedColorUnpainted = 0;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const target = artwork.grid[r][c];
        if (target > 0) {
          const painted = gridToCheck[r][c];
          if (painted !== target) {
            totalUnpainted++;
            if (target === selectedColorId) {
              selectedColorUnpainted++;
            }
          }
        }
      }
    }

    if (selectedColorUnpainted === 0) {
      soundManager.playColorCompleteSound();
      // Auto-advance to next incomplete color in palette
      const incomplete = artwork.palette.find(p => {
        let unp = 0;
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            if (artwork.grid[r][c] === p.id && gridToCheck[r][c] !== p.id) {
              unp++;
            }
          }
        }
        return unp > 0;
      });
      if (incomplete && incomplete.id !== selectedColorId) {
        setSelectedColorId(incomplete.id);
      }
    }

    if (totalUnpainted === 0) {
      soundManager.playVictorySound();
      onCompleteArtwork();
    }
  }, [artwork.grid, artwork.palette, height, width, selectedColorId, setSelectedColorId, onCompleteArtwork]);

  // Single Cell Paint Action
  const paintCell = useCallback((r: number, c: number) => {
    if (r < 0 || r >= height || c < 0 || c >= width) return;
    const targetColor = artwork.grid[r][c];
    if (targetColor === 0) return; // Background non-paintable cell

    if (selectedTool === 'eyedropper') {
      if (targetColor > 0) {
        soundManager.playTapSound();
        setSelectedColorId(targetColor);
        // Switch back to brush tool after picking
      }
      return;
    }

    if (selectedTool === 'eraser') {
      if (paintedGrid[r][c] !== 0) {
        setPaintedGrid(prev => {
          const next = prev.map(row => [...row]);
          next[r][c] = 0;
          onRecordHistory(next);
          return next;
        });
      }
      return;
    }

    // Painting with active color or bucket
    if (selectedTool === 'brush') {
      // Check if user clicked correct color
      if (selectedColorId === targetColor) {
        if (paintedGrid[r][c] !== selectedColorId) {
          soundManager.playTapSound();
          setPaintedGrid(prev => {
            const next = prev.map(row => [...row]);
            next[r][c] = selectedColorId;
            onRecordHistory(next);
            checkCompletion(next);
            return next;
          });
        }
      } else {
        // Soft error tap sound
        soundManager.playTapSound(0.6);
      }
    } else if (selectedTool === 'bucket') {
      // Flood fill contiguous matching target cells
      if (selectedColorId !== targetColor) {
        soundManager.playTapSound(0.6);
        return;
      }

      soundManager.playFillSound();
      setPaintedGrid(prev => {
        const next = prev.map(row => [...row]);
        const targetToFill = targetColor;
        const queue: [number, number][] = [[r, c]];
        const visited = new Set<string>();

        while (queue.length > 0) {
          const [cr, cc] = queue.pop()!;
          const key = `${cr},${cc}`;
          if (visited.has(key)) continue;
          visited.add(key);

          if (cr < 0 || cr >= height || cc < 0 || cc >= width) continue;
          if (artwork.grid[cr][cc] !== targetToFill) continue;

          next[cr][cc] = targetToFill;

          // 4-directional neighbors
          queue.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
        }

        onRecordHistory(next);
        checkCompletion(next);
        return next;
      });
    }
  }, [height, width, artwork.grid, selectedTool, selectedColorId, paintedGrid, setPaintedGrid, onRecordHistory, checkCompletion]);

  // Magic Wand Tool Action (auto fills up to 10 matching pixels for active color)
  const applyMagicWand = useCallback(() => {
    soundManager.playMagicSound();
    setPaintedGrid(prev => {
      const next = prev.map(row => [...row]);
      let count = 0;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (artwork.grid[r][c] === selectedColorId && next[r][c] !== selectedColorId) {
            next[r][c] = selectedColorId;
            count++;
            if (count >= 12) break; // Paint up to 12 at once
          }
        }
        if (count >= 12) break;
      }
      onRecordHistory(next);
      checkCompletion(next);
      return next;
    });
  }, [height, width, artwork.grid, selectedColorId, setPaintedGrid, onRecordHistory, checkCompletion]);

  // Expose magic wand trigger
  useEffect(() => {
    if (selectedTool === 'magic_wand') {
      applyMagicWand();
    }
  }, [selectedTool, applyMagicWand]);

  // Calculate cell size & coordinates from mouse event
  const getCellFromMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !containerRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellWidth = rect.width / width;
    const cellHeight = rect.height / height;
    const c = Math.floor(x / cellWidth);
    const r = Math.floor(y / cellHeight);

    if (r >= 0 && r < height && c >= 0 && c < width) {
      return { r, c };
    }
    return null;
  };

  // Mouse Handlers for Painting & Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      // Middle or Right Click / Shift = Pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button === 0) {
      const cell = getCellFromMouse(e);
      if (cell) {
        setIsPainting(true);
        setLastPaintedCell(cell);
        paintCell(cell.r, cell.c);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isPainting && selectedTool === 'brush') {
      const cell = getCellFromMouse(e);
      if (cell && (!lastPaintedCell || lastPaintedCell.r !== cell.r || lastPaintedCell.c !== cell.c)) {
        setLastPaintedCell(cell);
        paintCell(cell.r, cell.c);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsPainting(false);
    setLastPaintedCell(null);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoomScale(prev => Math.min(Math.max(0.5, prev * zoomFactor), 8.0));
  };

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution canvas dimensions
    const maxDim = Math.max(width, height);
    const baseCellSize = maxDim <= 16 ? 32 : maxDim <= 24 ? 24 : maxDim <= 36 ? 18 : maxDim <= 48 ? 14 : 11;
    const canvasWidth = width * baseCellSize;
    const canvasHeight = height * baseCellSize;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    const cellSize = baseCellSize;
    const isDark = document.documentElement.classList.contains('dark');

    // Clear background
    ctx.fillStyle = isDark ? '#18181B' : '#EAE6DF'; // Dark charcoal grey vs Light beige slate void
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const now = Date.now();
    const pulseFactor = (Math.sin(now / 200) + 1) / 2; // 0..1 smooth pulse

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = c * cellSize;
        const y = r * cellSize;

        const targetColorId = artwork.grid[r][c];
        const paintedColorId = paintedGrid[r][c];

        if (targetColorId === 0) {
          // Checkerboard background for transparent cells
          const isEven = (r + c) % 2 === 0;
          ctx.fillStyle = isEven ? (isDark ? '#18181B' : '#FAF7F2') : (isDark ? '#27272A' : '#E5E0D8');
          ctx.fillRect(x, y, cellSize, cellSize);
          continue;
        }

        const isPainted = paintedColorId === targetColorId;

        if (isPainted) {
          // Render painted solid color
          const hex = paletteMap.current.get(paintedColorId) || '#A8A29E';
          ctx.fillStyle = hex;
          ctx.fillRect(x, y, cellSize, cellSize);

          // Subtle inner border for pixel depth
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
        } else {
          // Unpainted cell background
          ctx.fillStyle = isDark ? '#27272A' : '#F5F2EB'; // Dark grey cell vs light unpainted cell
          ctx.fillRect(x, y, cellSize, cellSize);

          // Check if cell matches active selected color
          const isTargetedByActiveColor = targetColorId === selectedColorId;

          if (isTargetedByActiveColor) {
            // Pulse glow effect for target color cells
            ctx.fillStyle = isDark ? `rgba(228, 228, 231, ${0.2 + pulseFactor * 0.15})` : `rgba(180, 83, 9, ${0.12 + pulseFactor * 0.15})`;
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${0.75 + pulseFactor * 0.25})` : `rgba(180, 83, 9, ${0.6 + pulseFactor * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          } else {
            // Subtle cell grid border
            ctx.strokeStyle = isDark ? '#3F3F46' : '#D6D3D1';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }

          // Draw Number Label
          ctx.fillStyle = isTargetedByActiveColor 
            ? (isDark ? '#FFFFFF' : '#78350F') 
            : (isDark ? '#E4E4E7' : '#78716C'); // Light grey text in dark mode for high readability!
          ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.45))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(targetColorId.toString(), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }, [artwork.grid, paintedGrid, width, height, selectedColorId, zoomScale]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-[calc(100vh-14rem)] flex items-center justify-center overflow-hidden bg-[#FAF7F2] dark:bg-zinc-900 cursor-crosshair select-none transition-colors duration-200"
    >
      {/* Zoomable & Pannable Container */}
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative flex items-center justify-center p-8 bg-white dark:bg-zinc-800 rounded-3xl border border-stone-200 dark:border-zinc-700 shadow-md"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="rounded-xl shadow-md border border-stone-300 dark:border-zinc-700 touch-none"
        />
      </div>

      {/* Floating Canvas Hint Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-300 dark:border-zinc-700 text-[11px] text-stone-700 dark:text-zinc-200 font-semibold flex items-center gap-3 shadow-xs">
        <span>Left Click / Drag: Paint</span>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <span>Scroll: Zoom ({Math.round(zoomScale * 100)}%)</span>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <span>Shift / Drag: Pan</span>
      </div>
    </div>
  );
};
