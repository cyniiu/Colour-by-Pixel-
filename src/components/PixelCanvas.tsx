import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PixelArtwork, ColorPaletteItem, ToolType } from '../types';
import { soundManager } from '../utils/sound';
import { Bot, Swords, User, Timer, Trophy, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';

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
  gameMode?: 'solo' | 'bot_race';
  setGameMode?: (mode: 'solo' | 'bot_race') => void;
  onWinBotRace?: (durationSeconds: number) => void;
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
  gameMode = 'solo',
  setGameMode,
  onWinBotRace,
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

  // Bot Race State
  const [raceTimeSeconds, setRaceTimeSeconds] = useState<number>(0);
  const [raceStatus, setRaceStatus] = useState<'racing' | 'player_won' | 'bot_won'>('racing');
  const [botWarningToast, setBotWarningToast] = useState<string | null>(null);

  const width = artwork.width;
  const height = artwork.height;
  const colSplitIndex = Math.floor(width / 2); // 50/50 horizontal split
  const paletteMap = useRef<Map<number, string>>(new Map());

  // Update palette map
  useEffect(() => {
    const map = new Map<number, string>();
    artwork.palette.forEach((p) => map.set(p.id, p.hex));
    paletteMap.current = map;
  }, [artwork.palette]);

  // Reset pan, zoom, and race state on artwork load or mode change
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.0);
    setRaceTimeSeconds(0);
    setRaceStatus('racing');
    setBotWarningToast(null);
  }, [artwork.id, gameMode, setZoomScale]);

  // Calculate Bot Race Stats (Player's side vs Bot's side)
  let playerTotalTarget = 0;
  let playerPaintedCount = 0;
  let botTotalTarget = 0;
  let botPaintedCount = 0;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const target = artwork.grid[r][c];
      if (target > 0) {
        if (c < colSplitIndex) {
          playerTotalTarget++;
          if (paintedGrid[r]?.[c] === target) playerPaintedCount++;
        } else {
          botTotalTarget++;
          if (paintedGrid[r]?.[c] === target) botPaintedCount++;
        }
      }
    }
  }

  const playerPercent = playerTotalTarget > 0 ? Math.round((playerPaintedCount / playerTotalTarget) * 100) : 0;
  const botPercent = botTotalTarget > 0 ? Math.round((botPaintedCount / botTotalTarget) * 100) : 0;

  // Race Timer Interval
  useEffect(() => {
    if (gameMode !== 'bot_race' || raceStatus !== 'racing') return;

    const timer = setInterval(() => {
      setRaceTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, raceStatus]);

  // Bot Engine Interval (Must take AT LEAST 1 min 30s = 90,000ms to complete its half)
  useEffect(() => {
    if (gameMode !== 'bot_race' || raceStatus !== 'racing') return;

    // 90 seconds = 90,000 ms. Interval per cell = 90000 / botTotalTarget (min 300ms)
    const botIntervalMs = Math.max(300, Math.ceil((90 * 1000) / Math.max(botTotalTarget, 1)));

    const botInterval = setInterval(() => {
      setPaintedGrid(prev => {
        // Find unpainted cells on Bot's side (c >= colSplitIndex)
        const unpaintedCells: { r: number; c: number; colorId: number }[] = [];
        for (let r = 0; r < height; r++) {
          for (let c = colSplitIndex; c < width; c++) {
            const target = artwork.grid[r][c];
            if (target > 0 && prev[r][c] !== target) {
              unpaintedCells.push({ r, c, colorId: target });
            }
          }
        }

        if (unpaintedCells.length === 0) {
          // Bot has finished its side!
          setRaceStatus('bot_won');
          soundManager.playTapSound(0.5);
          return prev;
        }

        // Pick one cell to paint
        const cellToPaint = unpaintedCells[Math.floor(Math.random() * unpaintedCells.length)];
        const next = prev.map(row => [...row]);
        next[cellToPaint.r][cellToPaint.c] = cellToPaint.colorId;

        // Check if this was the last pixel for the bot
        if (unpaintedCells.length === 1) {
          setRaceStatus('bot_won');
          soundManager.playTapSound(0.5);
        }

        return next;
      });
    }, botIntervalMs);

    return () => clearInterval(botInterval);
  }, [gameMode, raceStatus, height, width, colSplitIndex, artwork.grid, botTotalTarget, setPaintedGrid]);

  // Check Player Win Condition in Bot Race
  useEffect(() => {
    if (gameMode === 'bot_race' && raceStatus === 'racing' && playerTotalTarget > 0 && playerPaintedCount === playerTotalTarget) {
      setRaceStatus('player_won');
      soundManager.playVictorySound();
      if (onWinBotRace) {
        onWinBotRace(raceTimeSeconds);
      }
    }
  }, [gameMode, raceStatus, playerTotalTarget, playerPaintedCount, raceTimeSeconds, onWinBotRace]);

  // Check Solo Completion
  const checkCompletion = useCallback((gridToCheck: number[][]) => {
    if (gameMode === 'bot_race') return; // Handled separately in Bot Race logic above

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
  }, [artwork.grid, artwork.palette, height, width, selectedColorId, setSelectedColorId, onCompleteArtwork, gameMode]);

  // Single Cell Paint Action
  const paintCell = useCallback((r: number, c: number) => {
    if (r < 0 || r >= height || c < 0 || c >= width) return;

    // Check Bot Race restrictions
    if (gameMode === 'bot_race') {
      if (c >= colSplitIndex) {
        setBotWarningToast("🤖 That's the Bot's side! Focus on your half (Left)!");
        soundManager.playTapSound(0.5);
        setTimeout(() => setBotWarningToast(null), 2500);
        return;
      }
    }

    const targetColor = artwork.grid[r][c];
    if (targetColor === 0) return; // Background non-paintable cell

    if (selectedTool === 'eyedropper') {
      if (targetColor > 0) {
        soundManager.playTapSound();
        setSelectedColorId(targetColor);
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
        soundManager.playTapSound(0.6);
      }
    } else if (selectedTool === 'bucket') {
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

          // Restrict bucket fill to player half in bot race mode
          if (gameMode === 'bot_race' && cc >= colSplitIndex) continue;

          if (artwork.grid[cr][cc] !== targetToFill) continue;

          next[cr][cc] = targetToFill;

          queue.push([cr + 1, cc], [cr - 1, cc], [cr, cc + 1], [cr, cc - 1]);
        }

        onRecordHistory(next);
        checkCompletion(next);
        return next;
      });
    }
  }, [height, width, artwork.grid, selectedTool, selectedColorId, paintedGrid, setPaintedGrid, onRecordHistory, checkCompletion, gameMode, colSplitIndex]);

  // Magic Wand Tool Action
  const applyMagicWand = useCallback(() => {
    soundManager.playMagicSound();
    setPaintedGrid(prev => {
      const next = prev.map(row => [...row]);
      let count = 0;
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          if (gameMode === 'bot_race' && c >= colSplitIndex) continue; // Skip bot side

          if (artwork.grid[r][c] === selectedColorId && next[r][c] !== selectedColorId) {
            next[r][c] = selectedColorId;
            count++;
            if (count >= 12) break;
          }
        }
        if (count >= 12) break;
      }
      onRecordHistory(next);
      checkCompletion(next);
      return next;
    });
  }, [height, width, artwork.grid, selectedColorId, setPaintedGrid, onRecordHistory, checkCompletion, gameMode, colSplitIndex]);

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

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
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
    const isCustomImage = artwork.category === 'Custom Upload';

    ctx.fillStyle = !isCustomImage ? (isDark ? '#D4D4D8' : '#FFFFFF') : (isDark ? '#18181B' : '#EAE6DF');
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const now = Date.now();
    const pulseFactor = (Math.sin(now / 200) + 1) / 2;

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const x = c * cellSize;
        const y = r * cellSize;

        const targetColorId = artwork.grid[r][c];
        const paintedColorId = paintedGrid[r][c];

        if (targetColorId === 0) {
          if (!isCustomImage) {
            ctx.fillStyle = isDark ? '#D4D4D8' : '#FFFFFF';
          } else {
            const isEven = (r + c) % 2 === 0;
            ctx.fillStyle = isEven ? (isDark ? '#18181B' : '#FFFFFF') : (isDark ? '#27272A' : '#F5F5F5');
          }
          ctx.fillRect(x, y, cellSize, cellSize);
          continue;
        }

        const isPainted = paintedColorId === targetColorId;

        if (isPainted) {
          const hex = paletteMap.current.get(paintedColorId) || '#A8A29E';
          ctx.fillStyle = hex;
          ctx.fillRect(x, y, cellSize, cellSize);

          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellSize, cellSize);
        } else {
          ctx.fillStyle = isDark ? '#27272A' : '#FFFFFF';
          ctx.fillRect(x, y, cellSize, cellSize);

          const isTargetedByActiveColor = targetColorId === selectedColorId;

          if (isTargetedByActiveColor) {
            ctx.fillStyle = isDark ? `rgba(228, 228, 231, ${0.2 + pulseFactor * 0.15})` : `rgba(180, 83, 9, ${0.12 + pulseFactor * 0.15})`;
            ctx.fillRect(x, y, cellSize, cellSize);

            ctx.strokeStyle = isDark ? `rgba(255, 255, 255, ${0.75 + pulseFactor * 0.25})` : `rgba(180, 83, 9, ${0.6 + pulseFactor * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          } else {
            ctx.strokeStyle = isDark ? '#3F3F46' : '#D6D3D1';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x, y, cellSize, cellSize);
          }

          ctx.fillStyle = isTargetedByActiveColor 
            ? (isDark ? '#FFFFFF' : '#78350F') 
            : (isDark ? '#E4E4E7' : '#78716C');
          ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.45))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(targetColorId.toString(), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    // Draw Bot Race Split Divider Line (at colSplitIndex)
    if (gameMode === 'bot_race') {
      const splitX = colSplitIndex * cellSize;
      
      // Vertical Glowing Divider
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, canvasHeight);
      ctx.strokeStyle = '#6366F1'; // Vibrant Indigo
      ctx.lineWidth = 4;
      ctx.shadowColor = '#818CF8';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();
    }
  }, [artwork.grid, paintedGrid, width, height, selectedColorId, zoomScale, gameMode, colSplitIndex]);

  // Format MM:SS for timer
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-[calc(100vh-14rem)] flex items-center justify-center overflow-hidden bg-white dark:bg-[#7F7C79] cursor-crosshair select-none transition-colors duration-200"
    >
      
      {/* Bot Race Top HUD Scoreboard */}
      {gameMode === 'bot_race' && (
        <div className="absolute top-4 z-20 max-w-xl w-[92%] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-lg space-y-2 text-xs">
          
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500 text-white font-extrabold flex items-center gap-1">
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Vs. Bot Artwork Race</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    50/50 Split
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                  Finish your half (Left) before Bot completes its half (Right)!
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 font-mono font-extrabold text-stone-800 dark:text-zinc-200 bg-stone-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-zinc-700">
                <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{formatTime(raceTimeSeconds)}</span>
              </div>

              {setGameMode && (
                <button
                  onClick={() => setGameMode('solo')}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 font-semibold rounded-lg transition-colors"
                >
                  Exit Race
                </button>
              )}
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-2 gap-3 pt-0.5">
            {/* Player Side */}
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-stone-800 dark:text-zinc-200">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <User className="w-3.5 h-3.5" />
                  <span>You (Left)</span>
                </span>
                <span className="font-mono">{playerPercent}%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${playerPercent}%` }} 
                />
              </div>
            </div>

            {/* Bot Side */}
            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold text-stone-800 dark:text-zinc-200">
                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Bot (Right)</span>
                </span>
                <span className="font-mono">{botPercent}%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${botPercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Race Banner Outcome */}
          {raceStatus === 'player_won' && (
            <div className="p-2 bg-emerald-500 text-white font-extrabold rounded-xl text-center flex items-center justify-center gap-2 animate-bounce shadow-md">
              <Trophy className="w-4 h-4" />
              <span>YOU BEAT THE BOT! +10 BONUS COINS EARNED! 🎉</span>
            </div>
          )}

          {raceStatus === 'bot_won' && (
            <div className="p-2 bg-indigo-600 text-white font-extrabold rounded-xl text-center flex items-center justify-center gap-2 shadow-md">
              <Bot className="w-4 h-4" />
              <span>Bot completed its half first! You can still finish your half!</span>
            </div>
          )}

        </div>
      )}

      {/* Bot Warning Toast */}
      {botWarningToast && (
        <div className="absolute top-20 z-30 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4" />
          <span>{botWarningToast}</span>
        </div>
      )}

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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-300 dark:border-zinc-700 text-[11px] text-stone-700 dark:text-zinc-200 font-semibold flex items-center gap-3 shadow-xs">
        <span>Left Click / Drag: Paint</span>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <span>Scroll: Zoom ({Math.round(zoomScale * 100)}%)</span>
        <span className="text-stone-300 dark:text-zinc-700">•</span>
        <span>Shift / Drag: Pan</span>
      </div>
    </div>
  );
};

