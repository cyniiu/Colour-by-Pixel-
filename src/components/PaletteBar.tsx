import React, { useState } from 'react';
import { Paintbrush, PaintBucket, Wand2, Eraser, Pipette, Undo2, ZoomIn, ZoomOut, Maximize2, Check, Eye, EyeOff, Palette } from 'lucide-react';
import { ColorPaletteItem, ToolType } from '../types';
import { PALETTE_THEMES, PaletteTheme } from '../utils/paletteThemes';

interface PaletteBarProps {
  palette: ColorPaletteItem[];
  selectedColorId: number;
  setSelectedColorId: (id: number) => void;
  selectedTool: ToolType;
  setSelectedTool: (tool: ToolType) => void;
  pixelCounts: Record<number, { total: number; painted: number }>;
  onUndo: () => void;
  canUndo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onUseMagicWand: () => void;
  activeThemeId?: string;
  onSelectTheme?: (themeId: string) => void;
}

export const PaletteBar: React.FC<PaletteBarProps> = ({
  palette,
  selectedColorId,
  setSelectedColorId,
  selectedTool,
  setSelectedTool,
  pixelCounts,
  onUndo,
  canUndo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onUseMagicWand,
  activeThemeId = 'original',
  onSelectTheme,
}) => {
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const selectedCounts = pixelCounts[selectedColorId] || { total: 0, painted: 0 };
  const remainingForSelected = selectedCounts.total - selectedCounts.painted;

  const visiblePalette = hideCompleted
    ? palette.filter((item) => {
        const stats = pixelCounts[item.id] || { total: 0, painted: 0 };
        return stats.total > 0 && stats.painted < stats.total;
      })
    : palette;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-4xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-stone-200 dark:border-zinc-800 rounded-2xl p-3 shadow-lg text-stone-800 dark:text-zinc-100 flex flex-col gap-3 transition-colors duration-200">
      
      {/* Top Controls Row: Tools, Action Utilities, Stats */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 border-b border-stone-200 dark:border-zinc-800 scrollbar-none">
        
        {/* Tool selector buttons */}
        <div className="flex items-center bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200 dark:border-zinc-700">
          <button
            onClick={() => setSelectedTool('brush')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'brush'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-600 dark:text-zinc-300 hover:text-[#5C4033] dark:hover:text-white hover:bg-[#F5EBE1] dark:hover:bg-zinc-700'
            }`}
            title="Brush Tool: Click or drag to color individual cells"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Brush</span>
          </button>

          <button
            onClick={() => setSelectedTool('bucket')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'bucket'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-600 dark:text-zinc-300 hover:text-[#5C4033] dark:hover:text-white hover:bg-[#F5EBE1] dark:hover:bg-zinc-700'
            }`}
            title="Bucket Fill: Fill all connected cells of matching color number"
          >
            <PaintBucket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fill</span>
          </button>

          <button
            onClick={() => setSelectedTool('eyedropper')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'eyedropper'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-600 dark:text-zinc-300 hover:text-[#5C4033] dark:hover:text-white hover:bg-[#F5EBE1] dark:hover:bg-zinc-700'
            }`}
            title="Eyedropper / Color Picker: Click any cell on canvas to pick its color"
          >
            <Pipette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Picker</span>
          </button>

          <button
            onClick={() => {
              setSelectedTool('magic_wand');
              onUseMagicWand();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'magic_wand'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-700 dark:text-zinc-300 hover:text-[#5C4033] dark:hover:text-white hover:bg-[#F5EBE1] dark:hover:bg-zinc-700'
            }`}
            title="Magic Wand: Auto-fill remaining pixels for selected color"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-200 dark:text-amber-400" />
            <span>Magic</span>
          </button>

          <button
            onClick={() => setSelectedTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'eraser'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-600 dark:text-zinc-300 hover:text-[#5C4033] dark:hover:text-white hover:bg-[#F5EBE1] dark:hover:bg-zinc-700'
            }`}
            title="Eraser Tool: Unpaint misclicked pixel"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eraser</span>
          </button>
        </div>

        {/* Middle Stats & Theme Switcher */}
        <div className="flex items-center gap-2">
          
          {/* Palette Theme Selector Button */}
          {onSelectTheme && (
            <div className="relative">
              <button
                onClick={() => setShowThemePicker((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5EBE1] dark:bg-zinc-800 hover:bg-[#EAE0D5] dark:hover:bg-zinc-700 text-[#5C4033] dark:text-zinc-200 rounded-xl text-xs font-bold border border-[#D0BFB0] dark:border-zinc-700 transition-all"
                title="Change Color Theme"
              >
                <Palette className="w-3.5 h-3.5 text-[#967259] dark:text-zinc-300" />
                <span className="capitalize">{activeThemeId}</span>
              </button>

              {/* Theme Dropdown Menu */}
              {showThemePicker && (
                <div className="absolute bottom-10 left-0 w-52 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                  <div className="text-[10px] font-bold text-stone-400 dark:text-zinc-500 uppercase tracking-wider px-2 py-1">
                    Select Palette Theme
                  </div>
                  {PALETTE_THEMES.map((theme: PaletteTheme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        onSelectTheme(theme.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        activeThemeId === theme.id
                          ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900'
                          : 'hover:bg-[#F5EBE1] dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{theme.name}</span>
                      {activeThemeId === theme.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Color Status Pill */}
          <div className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-zinc-300 bg-stone-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-zinc-700 whitespace-nowrap">
            {remainingForSelected > 0 ? (
              <span>
                Color <span className="font-bold text-stone-900 dark:text-zinc-100">#{selectedColorId}</span>: <span className="text-stone-900 dark:text-zinc-100 font-extrabold">{remainingForSelected}</span> left
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Color #{selectedColorId} Done!
              </span>
            )}
          </div>
        </div>

        {/* Right Canvas Utility & Filter Controls */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200 dark:border-zinc-700">
          
          {/* Hide Completed Swatches Toggle */}
          <button
            onClick={() => setHideCompleted((prev) => !prev)}
            className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 font-semibold ${
              hideCompleted 
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs' 
                : 'text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-zinc-700'
            }`}
            title={hideCompleted ? 'Showing Unfinished Swatches Only' : 'Show Unfinished Swatches Only'}
          >
            {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>

          <div className="w-[1px] h-4 bg-stone-300 dark:bg-zinc-700 my-auto" />

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-stone-300 dark:bg-zinc-700 my-auto" />

          {/* Zoom controls */}
          <button
            onClick={onZoomOut}
            className="p-1.5 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1.5 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Reset Zoom & Center Canvas"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Bottom Color Palette Swatches */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-stone-100 dark:scrollbar-track-zinc-800">
        {visiblePalette.map((item) => {
          const stats = pixelCounts[item.id] || { total: 0, painted: 0 };
          const isDone = stats.total > 0 && stats.painted >= stats.total;
          const isSelected = selectedColorId === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedColorId(item.id);
                if (selectedTool === 'eraser' || selectedTool === 'eyedropper') {
                  setSelectedTool('brush');
                }
              }}
              className={`relative flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all ${
                isSelected
                  ? 'ring-2 ring-[#967259] dark:ring-zinc-300 scale-105 bg-[#F5EBE1] dark:bg-zinc-800 shadow-md'
                  : 'bg-stone-100 dark:bg-zinc-800/60 hover:bg-[#F5EBE1] dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:scale-100'
              }`}
            >
              {/* Color Swatch Circle */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs border border-black/10 relative"
                style={{
                  backgroundColor: item.hex,
                  color: isLightColor(item.hex) ? '#1C1917' : '#FFFFFF',
                }}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  item.id
                )}
              </div>

              {/* Number Label / Progress Text */}
              <span className={`text-[10px] font-bold mt-1 ${isDone ? 'text-emerald-700 dark:text-emerald-400' : isSelected ? 'text-[#6F523B] dark:text-zinc-200' : 'text-stone-500 dark:text-zinc-400'}`}>
                {isDone ? 'Done' : `#${item.id}`}
              </span>

              {/* Active Selection Marker Dot */}
              {isSelected && (
                <div className="absolute -top-1 w-2 h-2 rounded-full bg-[#967259] dark:bg-zinc-200 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

// Helper function to check luminance for dark/light text contrast
function isLightColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  // Perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150;
}
