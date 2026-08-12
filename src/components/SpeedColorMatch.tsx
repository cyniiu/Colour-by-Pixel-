import React, { useState, useEffect } from 'react';
import { Award, Timer, Zap, RotateCcw, Trophy, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface SpeedColorMatchProps {
  onRewardCoins: (amount: number) => void;
}

const COLOR_ITEMS = [
  { name: 'RED', hex: '#EF4444' },
  { name: 'BLUE', hex: '#3B82F6' },
  { name: 'GREEN', hex: '#10B981' },
  { name: 'YELLOW', hex: '#F59E0B' },
  { name: 'PURPLE', hex: '#8B5CF6' },
  { name: 'ORANGE', hex: '#F97316' },
];

export const SpeedColorMatch: React.FC<SpeedColorMatchProps> = ({ onRewardCoins }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayKey = `speed_daily_count_${todayStr}`;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [score, setScore] = useState<number>(0);
  const [dailyCount, setDailyCount] = useState<number>(() => {
    return parseInt(localStorage.getItem(todayKey) || '0', 10);
  });
  const [rewardClaimedThisRound, setRewardClaimedThisRound] = useState<boolean>(false);

  // Current Target Prompt
  const [displayedText, setDisplayedText] = useState<string>('RED');
  const [displayedColorHex, setDisplayedColorHex] = useState<string>('#3B82F6');
  const [isMatchPrompt, setIsMatchPrompt] = useState<boolean>(false); // whether word name matches ink color

  const generateNewRound = () => {
    const isMatch = Math.random() < 0.5;
    const textItem = COLOR_ITEMS[Math.floor(Math.random() * COLOR_ITEMS.length)];
    
    let colorItem = textItem;
    if (!isMatch) {
      const otherItems = COLOR_ITEMS.filter(c => c.name !== textItem.name);
      colorItem = otherItems[Math.floor(Math.random() * otherItems.length)];
    }

    setDisplayedText(textItem.name);
    setDisplayedColorHex(colorItem.hex);
    setIsMatchPrompt(textItem.name === colorItem.name);
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(15);
    setScore(0);
    setRewardClaimedThisRound(false);
    generateNewRound();
  };

  // Game Countdown Timer
  useEffect(() => {
    if (!isPlaying) return;

    if (timeLeft <= 0) {
      setIsPlaying(false);
      if (score >= 10 && dailyCount < 3) {
        const nextCount = dailyCount + 1;
        setDailyCount(nextCount);
        setRewardClaimedThisRound(true);
        try {
          localStorage.setItem(todayKey, nextCount.toString());
        } catch {}
        onRewardCoins(10);
        soundManager.playVictorySound();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, dailyCount, onRewardCoins, todayKey]);

  const handleUserAnswer = (userSaysMatch: boolean) => {
    if (!isPlaying) return;

    if (userSaysMatch === isMatchPrompt) {
      soundManager.playTapSound(0.2);
      setScore(prev => prev + 1);
    } else {
      soundManager.playTapSound(0.6);
      setScore(prev => Math.max(0, prev - 1));
    }

    generateNewRound();
  };

  return (
    <div className="flex flex-col items-center justify-between space-y-4 max-w-md mx-auto w-full text-stone-800 dark:text-zinc-100">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Speed Match ({dailyCount}/3 Completed)
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-4 h-4 fill-amber-400 text-amber-600" />
            +10 Coins Each
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Does the WORD match the INK COLOR? Get 10 points in 15s! (Max 3 daily plays)
        </p>
      </div>

      {!isPlaying && score === 0 && !rewardClaimedThisRound ? (
        /* Start Screen */
        <div className="w-full text-center space-y-4 p-6 bg-stone-50 dark:bg-zinc-800/80 rounded-3xl border border-stone-200 dark:border-zinc-700">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Zap className="w-8 h-8 fill-amber-400 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900 dark:text-zinc-100">Reflex Color Match</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Tap YES if the word spelled matches its ink color, otherwise tap NO!
            </p>
          </div>
          <button
            onClick={startGame}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-sm rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            {dailyCount < 3 ? `Start Challenge Round (${dailyCount + 1}/3)` : 'Start Practice Challenge'}
          </button>
        </div>
      ) : isPlaying ? (
        /* Active Game Canvas */
        <div className="w-full space-y-5 text-center">
          
          {/* Top Timer & Score Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-stone-100 dark:bg-zinc-800 rounded-xl font-bold text-sm">
            <div className="flex items-center gap-1.5 text-stone-700 dark:text-zinc-300">
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Time: <span className="font-mono text-base font-black">{timeLeft}s</span></span>
            </div>
            <div className="text-amber-600 dark:text-amber-400">
              Score: <span className="font-mono text-base font-black">{score}/10</span>
            </div>
          </div>

          {/* Color Word Card */}
          <div className="p-8 bg-stone-50 dark:bg-zinc-900 rounded-3xl border-2 border-stone-200 dark:border-zinc-700 shadow-inner flex items-center justify-center">
            <span
              className="font-black text-4xl sm:text-5xl tracking-wider select-none animate-pulse"
              style={{ color: displayedColorHex }}
            >
              {displayedText}
            </span>
          </div>

          {/* Answer Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleUserAnswer(true)}
              className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              MATCH (YES)
            </button>
            <button
              onClick={() => handleUserAnswer(false)}
              className="py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              DIFFERENT (NO)
            </button>
          </div>

        </div>
      ) : (
        /* End Results */
        <div className="w-full text-center space-y-4 p-5 bg-stone-50 dark:bg-zinc-800/90 rounded-3xl border border-stone-200 dark:border-zinc-700 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900 dark:text-zinc-100">
              {score >= 10 ? 'Challenge Passed!' : 'Time Up!'}
            </h3>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              Final Score: {score} points
            </p>
          </div>

          {score >= 10 ? (
            <div className="p-3 bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md">
              <Award className="w-5 h-5 fill-amber-400 text-amber-600" />
              <span>
                {rewardClaimedThisRound
                  ? `Awesome Speed! +10 Coins Rewarded! (${dailyCount}/3 Daily Claims)`
                  : dailyCount >= 3
                  ? `Awesome Speed! (3/3 Daily Claims Completed)`
                  : `Challenge Passed!`}
              </span>
            </div>
          ) : (
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Reach at least 10 points to earn 10 bonus coins!
            </p>
          )}

          <button
            onClick={startGame}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{dailyCount < 3 ? `Play Round (${dailyCount + 1}/3)` : 'Play Again'}</span>
          </button>
        </div>
      )}

    </div>
  );
};
