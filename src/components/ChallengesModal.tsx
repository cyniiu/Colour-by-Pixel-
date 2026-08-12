import React, { useState } from 'react';
import { Target, Award, Sparkles, X, Coins, HelpCircle, Zap, BookOpen, Gift } from 'lucide-react';
import { WordleChallenge } from './WordleChallenge';
import { TriviaChallenge } from './TriviaChallenge';
import { SpeedColorMatch } from './SpeedColorMatch';
import { FreeActivitiesList } from './FreeActivitiesList';

interface ChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onRewardCoins: (amount: number) => void;
  onOpenAiModal?: () => void;
  onOpenUploadModal?: () => void;
}

export const ChallengesModal: React.FC<ChallengesModalProps> = ({
  isOpen,
  onClose,
  coins,
  onRewardCoins,
  onOpenAiModal,
  onOpenUploadModal,
}) => {
  const [activeChallengeTab, setActiveChallengeTab] = useState<'wordle' | 'trivia' | 'reflex' | 'tasks'>('wordle');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 text-stone-800 dark:text-zinc-100 space-y-5">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>Extra Coin Challenges</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              </h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Play mini challenges or complete online tasks for free unlock coins!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Balance Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
              <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
              <span>{coins} Coins</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Challenge Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-stone-100 dark:bg-zinc-800 p-1 rounded-2xl text-[11px] font-bold">
          <button
            onClick={() => setActiveChallengeTab('wordle')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeChallengeTab === 'wordle'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            <span>🔤 Wordle</span>
          </button>

          <button
            onClick={() => setActiveChallengeTab('trivia')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeChallengeTab === 'trivia'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Trivia</span>
          </button>

          <button
            onClick={() => setActiveChallengeTab('reflex')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeChallengeTab === 'reflex'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Speed</span>
          </button>

          <button
            onClick={() => setActiveChallengeTab('tasks')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeChallengeTab === 'tasks'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 shadow-xs font-extrabold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>+2 Tasks</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="py-1">
          {activeChallengeTab === 'wordle' && (
            <WordleChallenge onRewardCoins={onRewardCoins} coins={coins} />
          )}

          {activeChallengeTab === 'trivia' && (
            <TriviaChallenge onRewardCoins={onRewardCoins} />
          )}

          {activeChallengeTab === 'reflex' && (
            <SpeedColorMatch onRewardCoins={onRewardCoins} />
          )}

          {activeChallengeTab === 'tasks' && (
            <FreeActivitiesList
              onRewardCoins={onRewardCoins}
              onOpenAiModal={onOpenAiModal}
              onOpenUploadModal={onOpenUploadModal}
              onCloseParentModal={onClose}
            />
          )}
        </div>

      </div>
    </div>
  );
};
