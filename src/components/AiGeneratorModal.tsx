import React, { useState } from 'react';
import { Sparkles, X, Loader2, Wand2, Lightbulb } from 'lucide-react';
import { PixelArtwork } from '../types';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworkGenerated: (artwork: PixelArtwork) => void;
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onArtworkGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [gridSize, setGridSize] = useState<16 | 24 | 32>(16);
  const [colorCount, setColorCount] = useState<number>(8);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'Kawaii Astronaut Kitten',
    'Cyberpunk Neon Dragon',
    'Retro Arcade Game Console',
    'Pixel Boba Tea Cup',
    'Sunset Beach & Palm Tree',
    'Cute Magical Mushroom',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMsg('Please enter a description for your pixel artwork.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-pixel-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          gridSize,
          colorCount,
          category: 'AI Generated',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate pixel art');
      }

      onArtworkGenerated(data.artwork);
      onClose();
      setPrompt('');
    } catch (err: unknown) {
      console.error('AI Generation Error:', err);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 text-stone-800 dark:text-zinc-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-stone-900 dark:text-zinc-100">AI Pixel Art Generator</h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">Powered by Gemini AI Studio Engine</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Artwork Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A cute ginger cat wearing a wizard hat..."
              rows={3}
              className="w-full bg-stone-50 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 focus:border-stone-800 dark:focus:border-zinc-400 rounded-xl p-3 text-sm text-stone-900 dark:text-zinc-100 placeholder-stone-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-stone-800 dark:focus:ring-zinc-400 resize-none"
            />
          </div>

          {/* Inspirational Presets */}
          <div className="space-y-1.5">
            <span className="text-xs text-stone-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Try a sample prompt:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-stone-900 dark:hover:text-zinc-100 border border-stone-200 dark:border-zinc-700 text-[11px] text-stone-700 dark:text-zinc-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Size Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">
              Grid Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { size: 16, label: '16x16', diff: 'Easy' },
                { size: 24, label: '24x24', diff: 'Medium' },
                { size: 32, label: '32x32', diff: 'Hard' },
              ].map((opt) => (
                <button
                  key={opt.size}
                  type="button"
                  onClick={() => setGridSize(opt.size as 16 | 24 | 32)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    gridSize === opt.size
                      ? 'bg-[#967259] dark:bg-zinc-100 border-[#967259] dark:border-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-600 dark:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className={`text-[10px] ${gridSize === opt.size ? 'text-amber-100 dark:text-zinc-700' : 'text-stone-500 dark:text-zinc-400'}`}>{opt.diff}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Count */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">Color Palette Size</label>
              <span className="font-mono text-[#6F523B] dark:text-zinc-200 font-extrabold">{colorCount} Colors</span>
            </div>
            <input
              type="range"
              min="4"
              max="12"
              step="1"
              value={colorCount}
              onChange={(e) => setColorCount(Number(e.target.value))}
              className="w-full accent-white dark:accent-black bg-stone-300 dark:bg-zinc-800 h-2 rounded-lg cursor-pointer"
            />
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

        </div>

        {/* Submit Action */}
        <div className="pt-2 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#967259] dark:bg-zinc-100 hover:bg-[#805D46] dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Crafting Pixel Art...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-amber-300 dark:text-zinc-700" />
                <span>Generate Puzzle</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
