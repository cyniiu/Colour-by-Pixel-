import React, { useState } from 'react';
import { Award, CheckCircle2, XCircle, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface TriviaChallengeProps {
  onRewardCoins: (amount: number) => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ALL_TRIVIA_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Which iconic masterpiece features a swirling night sky over a quiet village?",
    options: ["Mona Lisa", "The Starry Night", "The Scream", "Girl with a Pearl Earring"],
    correctIndex: 1,
    explanation: "Vincent van Gogh painted 'The Starry Night' in 1889 from his room in Saint-Rémy-de-Provence!"
  },
  {
    id: 2,
    question: "In standard RGB color mixing, which two colors combine to produce Yellow?",
    options: ["Red + Green", "Red + Blue", "Blue + Green", "Cyan + Magenta"],
    correctIndex: 0,
    explanation: "In additive light color mixing (RGB), Red light + Green light creates Yellow!"
  },
  {
    id: 3,
    question: "Where is Leonardo da Vinci's original 'Mona Lisa' permanently displayed?",
    options: ["Metropolitan Museum of Art", "The Louvre Museum in Paris", "The Hermitage", "Uffizi Gallery"],
    correctIndex: 1,
    explanation: "The Mona Lisa resides in The Louvre Museum in Paris, France."
  },
  {
    id: 4,
    question: "What is the smallest controllable element of a picture represented on a digital screen?",
    options: ["Vector", "Voxel", "Pixel", "Palette"],
    correctIndex: 2,
    explanation: "Pixel is short for 'picture element' - the tiny squares of color that make up digital images!"
  },
  {
    id: 5,
    question: "Which Dutch Golden Age artist painted 'Girl with a Pearl Earring'?",
    options: ["Johannes Vermeer", "Rembrandt", "Claude Monet", "Pablo Picasso"],
    correctIndex: 0,
    explanation: "Johannes Vermeer painted 'Girl with a Pearl Earring' around 1665!"
  },
  {
    id: 6,
    question: "Which primary colors can be mixed together to produce Purple?",
    options: ["Red + Yellow", "Red + Blue", "Blue + Yellow", "Green + Red"],
    correctIndex: 1,
    explanation: "Mixing Red and Blue pigment produces Purple or Violet!"
  },
  {
    id: 7,
    question: "Who painted the famous surrealist artwork featuring melting clocks, titled 'The Persistence of Memory'?",
    options: ["René Magritte", "Salvador Dalí", "Frida Kahlo", "Henri Matisse"],
    correctIndex: 1,
    explanation: "Salvador Dalí created 'The Persistence of Memory' in 1931!"
  },
  {
    id: 8,
    question: "In the CMYK color printing model, what color does the letter 'K' stand for?",
    options: ["Kobalt", "Khaki", "Key / Black", "Krypton"],
    correctIndex: 2,
    explanation: "'K' stands for Key, which is typically Black ink used for printing alignment and depth!"
  },
  {
    id: 9,
    question: "What revolutionary art movement was pioneered by Claude Monet in 19th-century France?",
    options: ["Impressionism", "Cubism", "Surrealism", "Pop Art"],
    correctIndex: 0,
    explanation: "Monet's painting 'Impression, Sunrise' gave the Impressionism movement its name!"
  },
  {
    id: 10,
    question: "Which famous ceiling in Vatican City was painted by Michelangelo between 1508 and 1512?",
    options: ["St. Peter's Basilica Ceiling", "Sistine Chapel Ceiling", "Pantheon Dome", "Florence Cathedral Ceiling"],
    correctIndex: 1,
    explanation: "Michelangelo spent 4 years painting the magnificent Sistine Chapel ceiling!"
  },
  {
    id: 11,
    question: "What color is produced when all primary light colors (Red, Green, Blue) are combined at full brightness?",
    options: ["Black", "White", "Gray", "Brown"],
    correctIndex: 1,
    explanation: "Additive light combining Red, Green, and Blue light together produces pure White light!"
  },
  {
    id: 12,
    question: "Which Spanish master co-founded the Cubism movement alongside Georges Braque?",
    options: ["Francisco Goya", "Pablo Picasso", "Diego Velázquez", "Joan Miró"],
    correctIndex: 1,
    explanation: "Pablo Picasso co-founded Cubism, revolutionizing early 20th-century modern art!"
  },
  {
    id: 13,
    question: "What term describes two colors that sit directly opposite each other on the color wheel?",
    options: ["Analogous Colors", "Monochromatic", "Complementary Colors", "Triadic Colors"],
    correctIndex: 2,
    explanation: "Complementary colors (e.g. Red & Green, Blue & Orange) create high visual contrast!"
  },
  {
    id: 14,
    question: "Which legendary Japanese ukiyo-e master created 'The Great Wave off Kanagawa'?",
    options: ["Katsushika Hokusai", "Utamaro", "Hiroshige", "Takashi Murakami"],
    correctIndex: 0,
    explanation: "Hokusai created 'The Great Wave off Kanagawa' woodblock print around 1831!"
  },
  {
    id: 15,
    question: "What famous 1930 painting features a pitchfork-holding farmer and his daughter standing in front of a house?",
    options: ["American Gothic", "Whistler's Mother", "Nighthawks", "Christina's World"],
    correctIndex: 0,
    explanation: "Grant Wood painted 'American Gothic' in 1830, now displayed at the Art Institute of Chicago!"
  }
];

function getRandomThreeQuestions(): Question[] {
  const shuffled = [...ALL_TRIVIA_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export const TriviaChallenge: React.FC<TriviaChallengeProps> = ({ onRewardCoins }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayKey = `trivia_daily_count_${todayStr}`;

  const [roundQuestions, setRoundQuestions] = useState<Question[]>(() => getRandomThreeQuestions());
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [dailyCount, setDailyCount] = useState<number>(() => {
    return parseInt(localStorage.getItem(todayKey) || '0', 10);
  });
  const [rewardClaimedThisRound, setRewardClaimedThisRound] = useState<boolean>(false);

  const currentQ = roundQuestions[currentIdx] || roundQuestions[0];

  const handleSelectOption = (optIdx: number) => {
    if (selectedOption !== null) return; // Prevent double select
    setSelectedOption(optIdx);

    const isCorrect = optIdx === currentQ.correctIndex;
    if (isCorrect) {
      soundManager.playVictorySound();
      setScore(prev => prev + 1);
    } else {
      soundManager.playTapSound(0.7);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < 3) { // 3 questions total
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      const finalScore = score;
      if (finalScore >= 2 && dailyCount < 3) {
        const nextCount = dailyCount + 1;
        setDailyCount(nextCount);
        setRewardClaimedThisRound(true);
        try {
          localStorage.setItem(todayKey, nextCount.toString());
        } catch {}
        onRewardCoins(10);
      }
    }
  };

  const restartQuiz = () => {
    // Pick a fresh random set of 3 questions
    setRoundQuestions(getRandomThreeQuestions());
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setRewardClaimedThisRound(false);
  };

  return (
    <div className="flex flex-col items-center justify-between space-y-4 max-w-md mx-auto w-full text-stone-800 dark:text-zinc-100">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Art Trivia ({dailyCount}/3 Completed)
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-4 h-4 fill-amber-400 text-amber-600" />
            +10 Coins Each
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Answer 3 art & color trivia questions! (Max 3 daily plays)
        </p>
      </div>

      {!isFinished ? (
        <div className="w-full space-y-4">
          
          {/* Question Card */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-800/80 rounded-2xl border border-stone-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-500 dark:text-zinc-400">
              <span>Question {currentIdx + 1} of 3</span>
              <span className="text-amber-600 dark:text-amber-400">Score: {score}</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-zinc-100 leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;
              let btnClass = "bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-600 text-stone-800 dark:text-zinc-200";

              if (selectedOption !== null) {
                if (isCorrect) {
                  btnClass = "bg-emerald-500 text-white border-emerald-600 font-extrabold";
                } else if (isSelected) {
                  btnClass = "bg-rose-500 text-white border-rose-600 font-extrabold";
                } else {
                  btnClass = "bg-stone-100 dark:bg-zinc-800/40 opacity-50 border-stone-200 dark:border-zinc-800 text-stone-400 dark:text-zinc-500";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null}
                  className={`w-full p-3.5 rounded-xl border-2 text-left font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${btnClass}`}
                >
                  <span>{option}</span>
                  {selectedOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  {selectedOption !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {selectedOption !== null && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                💡 <span className="font-bold">{currentQ.explanation}</span>
              </div>
              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-sm rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {currentIdx + 1 < 3 ? 'Next Question →' : 'See Results →'}
              </button>
            </div>
          )}

        </div>
      ) : (
        /* Quiz Complete Results */
        <div className="w-full text-center space-y-4 p-5 bg-stone-50 dark:bg-zinc-800/90 rounded-3xl border border-stone-200 dark:border-zinc-700 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-stone-900 dark:text-zinc-100">Trivia Complete!</h3>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
              You scored {score} out of 3!
            </p>
          </div>

          {score >= 2 ? (
            <div className="p-3 bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md">
              <Award className="w-5 h-5 fill-amber-400 text-amber-600" />
              <span>
                {rewardClaimedThisRound
                  ? `Great Job! +10 Coins Rewarded! (${dailyCount}/3 Daily Claims)`
                  : dailyCount >= 3
                  ? `Quiz Passed! (3/3 Daily Claims Completed)`
                  : `Quiz Passed!`}
              </span>
            </div>
          ) : (
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              Score at least 2 out of 3 to claim 10 bonus coins!
            </p>
          )}

          <button
            onClick={restartQuiz}
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
