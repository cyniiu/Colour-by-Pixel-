import React from 'react';
import { Lock, Coins, Sparkles, AlertCircle, Check, X } from 'lucide-react';
import { PixelArtwork } from '../types';

interface UnlockModalProps {
  isOpen: boolean;
  artwork: PixelArtwork | null;
  coins: number;
  onUnlock: (artworkId: string) => void;
  onClose: () => void;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({
  isOpen,
  artwork,
  coins,
  onUnlock,
  onClose,
}) => {
  if (!isOpen || !artwork) return null;

  const UNLOCK_COST = 5;
  const canAfford = coins >= UNLOCK_COST;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-xl p-6 text-stone-800 dark:text-zinc-100 space-y-5 text-center">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 p-1 mx-auto flex items-center justify-center shadow-xs">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-stone-900 dark:text-zinc-100">Unlock Artwork</h2>
          <p className="text-sm font-semibold text-[#967259] dark:text-zinc-300">{artwork.title}</p>
          <p className="text-xs text-stone-500 dark:text-zinc-400">
            Category: {artwork.category} • Size: {artwork.width}x{artwork.height}
          </p>
        </div>

        {/* Price Card */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-800/80 rounded-2xl border border-stone-200 dark:border-zinc-700 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-6 h-6 fill-amber-400 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Unlock Cost</div>
              <div className="text-base font-extrabold text-stone-900 dark:text-zinc-100">{UNLOCK_COST} Coins</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-stone-500 dark:text-zinc-400 font-medium">Your Balance</div>
            <div className={`text-base font-extrabold ${canAfford ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {coins} Coins
            </div>
          </div>
        </div>

        {!canAfford && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-left flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>You need 5 coins to unlock this puzzle. Complete free artworks or win Bot Races to earn more coins!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {canAfford ? (
            <button
              onClick={() => onUnlock(artwork.id)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Unlock for 5 Coins</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-stone-100 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 font-semibold text-xs rounded-xl border border-stone-200 dark:border-zinc-700"
            >
              Close
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
