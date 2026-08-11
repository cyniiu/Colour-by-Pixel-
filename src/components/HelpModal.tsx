import React from 'react';
import { X, Paintbrush, PaintBucket, Wand2, Eraser, ZoomIn, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 text-stone-800 dark:text-zinc-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-lg text-stone-900 dark:text-zinc-100">How to Play Color by Pixel</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-4 text-xs text-stone-600 dark:text-zinc-300">
          
          <div className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">Select a Color</p>
              <p className="text-stone-600 dark:text-zinc-400 mt-0.5">
                Pick a numbered color from the bottom palette bar. All matching unpainted cells on the grid will pulse with a light outline!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">Tap or Drag to Paint</p>
              <p className="text-stone-600 dark:text-zinc-400 mt-0.5">
                Click cells to color them. Hold and drag your cursor to paint continuously across adjacent cells.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">Use Power Tools</p>
              <div className="mt-1 space-y-1 text-stone-600 dark:text-zinc-400">
                <p className="flex items-center gap-1.5"><PaintBucket className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300" /> <span className="font-semibold text-stone-900 dark:text-zinc-200">Fill Bucket:</span> Color connected cells of the same number instantly.</p>
                <p className="flex items-center gap-1.5"><Wand2 className="w-3.5 h-3.5 text-amber-600 dark:text-zinc-200" /> <span className="font-semibold text-stone-900 dark:text-zinc-200">Magic Wand:</span> Auto-fill up to 12 matching cells for active color.</p>
                <p className="flex items-center gap-1.5"><Eraser className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> <span className="font-semibold text-stone-900 dark:text-zinc-200">Eraser:</span> Clear misclicked pixels.</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="w-6 h-6 rounded-lg bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">AI Art & Photo Upload</p>
              <p className="text-stone-600 dark:text-zinc-400 mt-0.5">
                Click &ldquo;AI Art&rdquo; in the header to generate infinite custom puzzles with Gemini, or upload your own photos!
              </p>
            </div>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#967259] dark:bg-zinc-100 hover:bg-[#805D46] dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-xl transition-colors shadow-xs"
        >
          Got it, Let&apos;s Paint!
        </button>

      </div>
    </div>
  );
};
