import React, { useState } from 'react';
import { Share2, Star, Image, Sparkles, CheckCircle2, Award, Copy, ExternalLink, ThumbsUp, X, Send, QrCode } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface FreeActivitiesListProps {
  onRewardCoins: (amount: number) => void;
  onOpenAiModal?: () => void;
  onOpenUploadModal?: () => void;
  onCloseParentModal?: () => void;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  reward: number;
  actionText: string;
}

export const FreeActivitiesList: React.FC<FreeActivitiesListProps> = ({
  onRewardCoins,
  onOpenAiModal,
  onOpenUploadModal,
  onCloseParentModal,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const storageKey = `pixel_claimed_free_tasks_${todayStr}`;

  const [claimedIds, setClaimedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSubModal, setActiveSubModal] = useState<'none' | 'share' | 'rate' | 'showcase'>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [upvotedArtworks, setUpvotedArtworks] = useState<string[]>([]);

  const ACTIVITIES: ActivityItem[] = [
    {
      id: 'task_share',
      title: 'Share Pixel Color Studio',
      description: 'Open share sheet, social media links, or copy referral URL',
      icon: Share2,
      reward: 2,
      actionText: 'Share App'
    },
    {
      id: 'task_rate',
      title: 'Rate & Leave Feedback',
      description: 'Give a 5-star rating for our coloring pixel app experience',
      icon: Star,
      reward: 2,
      actionText: 'Rate 5 Stars'
    },
    {
      id: 'task_ai_gen',
      title: 'Try AI Pixel Prompt',
      description: 'Generate any custom pixel artwork using Gemini AI',
      icon: Sparkles,
      reward: 2,
      actionText: 'Try Generator'
    },
    {
      id: 'task_upload_photo',
      title: 'Convert a Personal Photo',
      description: 'Upload any photo and turn it into a custom color-by-number grid',
      icon: Image,
      reward: 2,
      actionText: 'Upload Photo'
    },
    {
      id: 'task_like_community',
      title: 'Join Daily Pixel Showcase',
      description: 'Browse featured masterpieces and vote for top pixel creations',
      icon: ThumbsUp,
      reward: 2,
      actionText: 'Visit Showcase'
    }
  ];

  const markTaskClaimed = (taskId: string, reward: number) => {
    if (claimedIds.includes(taskId)) return;

    soundManager.playVictorySound();
    onRewardCoins(reward);

    const nextClaimed = [...claimedIds, taskId];
    setClaimedIds(nextClaimed);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextClaimed));
    } catch {}
  };

  const handleExecuteActivity = (activity: ActivityItem) => {
    if (activity.id === 'task_share') {
      setActiveSubModal('share');
    } else if (activity.id === 'task_rate') {
      setActiveSubModal('rate');
    } else if (activity.id === 'task_like_community') {
      setActiveSubModal('showcase');
    } else if (activity.id === 'task_ai_gen') {
      markTaskClaimed(activity.id, activity.reward);
      if (onCloseParentModal) onCloseParentModal();
      if (onOpenAiModal) onOpenAiModal();
    } else if (activity.id === 'task_upload_photo') {
      markTaskClaimed(activity.id, activity.reward);
      if (onCloseParentModal) onCloseParentModal();
      if (onOpenUploadModal) onOpenUploadModal();
    }
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : 'https://pixelcolorstudio.app';

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentAppUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      markTaskClaimed('task_share', 2);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pixel Color Studio',
          text: 'Color famous masterpiece artworks by pixel number with AI & multiplayer bot races!',
          url: currentAppUrl
        });
        markTaskClaimed('task_share', 2);
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleSubmitRating = () => {
    markTaskClaimed('task_rate', 2);
    setToastMessage('Thank you for your rating! ⭐⭐⭐⭐⭐');
    setTimeout(() => {
      setToastMessage(null);
      setActiveSubModal('none');
    }, 1500);
  };

  const handleUpvoteShowcase = (artId: string) => {
    if (!upvotedArtworks.includes(artId)) {
      setUpvotedArtworks(prev => [...prev, artId]);
      soundManager.playColorCompleteSound();
      markTaskClaimed('task_like_community', 2);
    }
  };

  return (
    <div className="space-y-3.5 max-w-md mx-auto w-full">
      {/* Header Info */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Free Online Tasks
          </span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-4 h-4 fill-amber-400 text-amber-600" />
            +2 Coins Each
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Online tasks reset daily! (1x limit per task each day)
        </p>
      </div>

      {/* List of Tasks */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {ACTIVITIES.map(item => {
          const isClaimed = claimedIds.includes(item.id);
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isClaimed
                  ? 'bg-stone-100/60 dark:bg-zinc-800/40 border-stone-200 dark:border-zinc-800 opacity-70'
                  : 'bg-white dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 shadow-xs hover:border-amber-300 dark:hover:border-amber-700'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isClaimed
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-stone-900 dark:text-zinc-100 truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 truncate">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {isClaimed ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-2.5 py-1 bg-emerald-500/10 rounded-full border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done (+2)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExecuteActivity(item)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>{item.actionText}</span>
                    <span className="bg-stone-900 text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                      +2
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SHARE APP SUB-MODAL OVERLAY */}
      {activeSubModal === 'share' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-stone-900 dark:text-zinc-100">
            <button
              onClick={() => setActiveSubModal('none')}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">Share Pixel Color Studio</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Invite friends to color famous masterpieces & earn +2 free coins!
              </p>
            </div>

            {/* Copy Link Input Box */}
            <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-zinc-800 rounded-2xl border border-stone-200 dark:border-zinc-700">
              <input
                type="text"
                readOnly
                value={currentAppUrl}
                className="w-full bg-transparent text-xs font-mono px-2 text-stone-700 dark:text-zinc-300 outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-xs rounded-xl shrink-0 flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Direct Social Share Quick Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Color famous masterpiece artworks by pixel number with AI!')}&url=${encodeURIComponent(currentAppUrl)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => markTaskClaimed('task_share', 2)}
                className="p-2.5 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>🐦 X / Twitter</span>
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Color famous masterpieces by pixel number: ' + currentAppUrl)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => markTaskClaimed('task_share', 2)}
                className="p-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>💬 WhatsApp</span>
              </a>
            </div>

            {/* Prominent Web Share Button */}
            <button
              onClick={handleNativeShare}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Open Native Share Sheet (+2 Coins)</span>
            </button>
          </div>
        </div>
      )}

      {/* RATE APP SUB-MODAL OVERLAY */}
      {activeSubModal === 'rate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-stone-900 dark:text-zinc-100 text-center">
            <button
              onClick={() => setActiveSubModal('none')}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
                <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              </div>
              <h3 className="text-base font-black">Rate Your Experience</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                How are you enjoying Pixel Color Studio?
              </p>
            </div>

            {/* Star Rating Buttons */}
            <div className="flex justify-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map(starNum => (
                <button
                  key={starNum}
                  onClick={() => setSelectedStars(starNum)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      starNum <= selectedStars
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-stone-300 dark:text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="What do you love most or want us to add? (Optional)"
              className="w-full p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-xl text-xs text-stone-800 dark:text-zinc-200 outline-none border border-stone-200 dark:border-zinc-700 resize-none h-16"
            />

            {toastMessage ? (
              <div className="p-2.5 bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs">
                {toastMessage}
              </div>
            ) : (
              <button
                onClick={handleSubmitRating}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-900 font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Submit Review (+2 Coins)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SHOWCASE SUB-MODAL OVERLAY */}
      {activeSubModal === 'showcase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-stone-900 dark:text-zinc-100">
            <button
              onClick={() => setActiveSubModal('none')}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
                <ThumbsUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black">Daily Pixel Showcase</h3>
              <p className="text-xs text-stone-500 dark:text-zinc-400">
                Upvote featured player masterpieces to collect +2 coins!
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {[
                { id: 'sc_1', title: 'Starry Night Neon', artist: 'PixelMaster99', likes: 142 },
                { id: 'sc_2', title: 'Mona Lisa Cyberpunk', artist: 'ArtBot_Pro', likes: 98 },
                { id: 'sc_3', title: 'Great Wave Pastel', artist: 'ColorWave', likes: 210 }
              ].map(art => {
                const isUpvoted = upvotedArtworks.includes(art.id);
                return (
                  <div
                    key={art.id}
                    className="p-2.5 bg-stone-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-between gap-2 border border-stone-200 dark:border-zinc-700"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs">{art.title}</h4>
                      <p className="text-[10px] text-stone-500 dark:text-zinc-400">By {art.artist}</p>
                    </div>
                    <button
                      onClick={() => handleUpvoteShowcase(art.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 cursor-pointer ${
                        isUpvoted
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-stone-900 hover:bg-amber-600'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{art.likes + (isUpvoted ? 1 : 0)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
