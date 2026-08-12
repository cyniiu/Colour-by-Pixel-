import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, RotateCcw, AlertCircle, Award, Lightbulb, HelpCircle } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface WordleChallengeProps {
  onRewardCoins: (amount: number) => void;
  coins: number;
}

const ART_WORDS = [
  'PAINT', 'BRUSH', 'PIXEL', 'SHADE', 'FRAME', 'BLEND', 'IMAGE', 'DRAFT',
  'MURAL', 'CHALK', 'DEPTH', 'TRACE', 'PRINT', 'CRAFT', 'PAPER', 'GLAZE',
  'MODEL', 'COLOR', 'TONES', 'AMBER', 'CORAL', 'IVORY', 'SEPIA', 'AZURE',
  'FLAME', 'SATIN', 'OCHRE', 'LIGHT', 'STORM', 'PENCIL'
];

// Helper to pick deterministic word based on current date
const getDailyWord = (): string => {
  const todayStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash << 5) - hash + todayStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ART_WORDS.length;
  return ART_WORDS[index];
};

export const WordleChallenge: React.FC<WordleChallengeProps> = ({ onRewardCoins, coins }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayKey = `wordle_daily_count_${todayStr}`;

  const [targetWord, setTargetWord] = useState<string>(() => getDailyWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'IN_PROGRESS' | 'WON' | 'LOST'>('IN_PROGRESS');
  const [dailyCount, setDailyCount] = useState<number>(() => {
    return parseInt(localStorage.getItem(todayKey) || '0', 10);
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const MAX_ATTEMPTS = 6;
  const WORD_LENGTH = 5;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCharInput = useCallback((char: string) => {
    if (gameStatus !== 'IN_PROGRESS') return;
    if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => (prev + char).toUpperCase());
      soundManager.playTapSound(0.2);
    }
  }, [currentGuess, gameStatus]);

  const handleDeleteChar = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS') return;
    if (currentGuess.length > 0) {
      setCurrentGuess(prev => prev.slice(0, -1));
      soundManager.playTapSound(0.15);
    }
  }, [currentGuess, gameStatus]);

  const handleSubmitGuess = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS') return;

    if (currentGuess.length !== WORD_LENGTH) {
      showToast('Word must be 5 letters!');
      soundManager.playTapSound(0.5);
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');
    soundManager.playTapSound(0.4);

    if (currentGuess === targetWord) {
      setGameStatus('WON');
      soundManager.playVictorySound();

      if (dailyCount < 3) {
        const nextCount = dailyCount + 1;
        setDailyCount(nextCount);
        try {
          localStorage.setItem(todayKey, nextCount.toString());
        } catch {}
        onRewardCoins(15);
        showToast(`🎉 +15 Coins Earned! (${nextCount}/3 daily rewards collected)`);
      } else {
        showToast(`Great job! Daily reward limit reached (3/3 completed today).`);
      }
    } else if (nextGuesses.length >= MAX_ATTEMPTS) {
      setGameStatus('LOST');
      soundManager.playTapSound(0.7);
    }
  }, [currentGuess, gameStatus, guesses, targetWord, dailyCount, onRewardCoins, todayKey]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmitGuess();
      } else if (e.key === 'Backspace') {
        handleDeleteChar();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleCharInput(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCharInput, handleDeleteChar, handleSubmitGuess]);

  const startNextRound = () => {
    const randomWord = ART_WORDS[Math.floor(Math.random() * ART_WORDS.length)];
    setTargetWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('IN_PROGRESS');
  };

  // Letter Status Resolver for grid tiles
  const getLetterStatus = (letter: string, index: number, word: string) => {
    if (targetWord[index] === letter) {
      return 'correct'; // Green
    }
    if (targetWord.includes(letter)) {
      return 'present'; // Yellow
    }
    return 'absent'; // Gray
  };

  // Keyboard letter color status resolver
  const getKeyboardStatus = (key: string) => {
    let status = 'default';
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (targetWord[i] === key) {
            return 'correct';
          }
          if (targetWord.includes(key) && status !== 'correct') {
            status = 'present';
          }
          if (!targetWord.includes(key) && status === 'default') {
            status = 'absent';
          }
        }
      }
    }
    return status;
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']
  ];

  return (
    <div className="flex flex-col items-center justify-between space-y-4 max-w-md mx-auto w-full">
      
      {/* Challenge Header & Rules */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Daily Wordle ({dailyCount}/3 Completed)
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-4 h-4 fill-amber-400 text-amber-600" />
            +15 Coins Each
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Guess the 5-letter art or color word in 6 tries! (Max 3 daily plays)
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-stone-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Wordle Grid (6 rows x 5 tiles) */}
      <div className="grid grid-rows-6 gap-1.5 w-full max-w-[280px]">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '');

          return (
            <div key={rowIndex} className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                const char = guess[colIndex] || '';
                const isSubmitted = rowIndex < guesses.length;
                let tileStatusClass = 'bg-white dark:bg-zinc-800 border-stone-300 dark:border-zinc-700 text-stone-900 dark:text-zinc-100';

                if (isSubmitted) {
                  const status = getLetterStatus(char, colIndex, guess);
                  if (status === 'correct') {
                    tileStatusClass = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-xs';
                  } else if (status === 'present') {
                    tileStatusClass = 'bg-amber-500 text-white border-amber-600 font-extrabold shadow-xs';
                  } else {
                    tileStatusClass = 'bg-stone-400 dark:bg-zinc-700 text-white border-stone-500 dark:border-zinc-600';
                  }
                } else if (char) {
                  tileStatusClass = 'bg-stone-100 dark:bg-zinc-700 border-stone-500 dark:border-zinc-500 text-stone-900 dark:text-zinc-100 scale-105 transition-transform';
                }

                return (
                  <div
                    key={colIndex}
                    className={`aspect-square w-full rounded-xl border-2 flex items-center justify-center font-black text-lg uppercase transition-all duration-300 select-none ${tileStatusClass}`}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Outcome Banner */}
      {gameStatus === 'WON' && (
        <div className="w-full bg-emerald-500 text-white p-3.5 rounded-2xl text-center space-y-2 shadow-lg animate-fade-in">
          <div className="flex items-center justify-center gap-1.5 font-black text-base">
            <Sparkles className="w-5 h-5 fill-white" />
            <span>EXCELLENT! YOU GUESSED IT!</span>
          </div>
          <p className="text-xs font-semibold text-emerald-100">
            The word was <span className="font-extrabold uppercase underline tracking-wider">{targetWord}</span>
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 text-white font-extrabold text-xs rounded-full">
              <Award className="w-4 h-4 fill-amber-400 text-amber-600" />
              <span>Plays Today: {dailyCount}/3</span>
            </div>
            <button
              onClick={startNextRound}
              className="px-4 py-1.5 bg-white text-emerald-800 font-extrabold text-xs rounded-xl hover:bg-emerald-50 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              {dailyCount < 3 ? `Play Next Round (${dailyCount + 1}/3)` : 'Play Practice Mode'}
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'LOST' && (
        <div className="w-full bg-rose-600 text-white p-3.5 rounded-2xl text-center space-y-2 shadow-lg animate-fade-in">
          <div className="font-extrabold text-sm flex items-center justify-center gap-1.5">
            <AlertCircle className="w-5 h-5" />
            <span>Nice try! The word was: {targetWord}</span>
          </div>
          <button
            onClick={startNextRound}
            className="px-4 py-1.5 bg-white text-rose-800 font-extrabold text-xs rounded-xl hover:bg-rose-50 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            {dailyCount < 3 ? `Try Round (${dailyCount + 1}/3)` : 'Try Practice Mode'}
          </button>
        </div>
      )}

      {/* On-Screen QWERTY Keyboard */}
      <div className="w-full space-y-1.5 pt-2">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map(key => {
              const status = getKeyboardStatus(key);
              let btnClass = 'bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-stone-300 dark:hover:bg-zinc-700';

              if (status === 'correct') {
                btnClass = 'bg-emerald-500 text-white font-black';
              } else if (status === 'present') {
                btnClass = 'bg-amber-500 text-white font-black';
              } else if (status === 'absent') {
                btnClass = 'bg-stone-400/60 dark:bg-zinc-800/40 text-stone-400 dark:text-zinc-600';
              }

              const isSpecial = key === 'ENTER' || key === 'DEL';

              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'ENTER') handleSubmitGuess();
                    else if (key === 'DEL') handleDeleteChar();
                    else handleCharInput(key);
                  }}
                  className={`${
                    isSpecial ? 'px-2.5 sm:px-3 text-[10px] font-extrabold' : 'w-8 sm:w-9 text-xs font-bold'
                  } h-11 rounded-lg border border-stone-300 dark:border-zinc-700/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer ${btnClass}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
};
