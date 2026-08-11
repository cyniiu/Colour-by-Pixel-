import React from 'react';
import { Palette, Sparkles, Image as ImageIcon, Volume2, VolumeX, HelpCircle, LayoutGrid, CloudCheck, Sun, Moon } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface NavbarProps {
  activeTab: 'gallery' | 'editor';
  setActiveTab: (tab: 'gallery' | 'editor') => void;
  onOpenAiModal: () => void;
  onOpenUploadModal: () => void;
  onOpenHelpModal: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  completedCount: number;
  totalTemplatesCount: number;
  activeArtworkTitle?: string;
  artworkProgress?: number;
  isCloudSynced?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiModal,
  onOpenUploadModal,
  onOpenHelpModal,
  isMuted,
  setIsMuted,
  isDarkMode,
  onToggleDarkMode,
  completedCount,
  totalTemplatesCount,
  activeArtworkTitle,
  artworkProgress,
  isCloudSynced = true,
}) => {
  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-stone-200 dark:border-zinc-800 text-stone-800 dark:text-zinc-100 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('gallery')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 flex items-center justify-center shadow-xs group-hover:bg-stone-200 dark:group-hover:bg-zinc-700 transition-colors">
              <Palette className="w-5 h-5 text-stone-700 dark:text-zinc-200 transition-transform duration-700 ease-in-out group-hover:rotate-[360deg]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-stone-900 dark:text-zinc-100 flex items-center gap-1.5">
                Pixel<span className="text-[#967259] dark:text-[#CBB29D]">Color</span>
                <span 
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  title="Your progress and custom artworks are automatically saved to the cloud"
                >
                  <CloudCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Cloud Saved</span>
                </span>
              </span>
              <span className="text-xs text-stone-500 dark:text-zinc-400 hidden sm:block">Color by Pixel Art Studio</span>
            </div>
          </button>

          {/* Active Artwork Status Pill if in Editor */}
          {activeTab === 'editor' && activeArtworkTitle && (
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-stone-200 dark:border-zinc-800">
              <span className="text-sm font-semibold text-stone-700 dark:text-zinc-300 truncate max-w-[180px]">
                {activeArtworkTitle}
              </span>
              {typeof artworkProgress === 'number' && (
                <div className="flex items-center gap-2 bg-[#F5EBE1] dark:bg-zinc-800 px-2.5 py-1 rounded-full text-xs font-semibold text-[#6F523B] dark:text-zinc-300 border border-[#E4D5C7] dark:border-zinc-700">
                  <div className="w-12 bg-[#E4D5C7] dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#967259] dark:bg-[#CBB29D] h-full transition-all duration-300" 
                      style={{ width: `${artworkProgress}%` }}
                    />
                  </div>
                  <span>{artworkProgress}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Tabs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Navigation Tabs */}
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'gallery'
                ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'text-stone-600 dark:text-zinc-300 hover:bg-[#F5EBE1] dark:hover:bg-zinc-800 hover:text-[#5C4033] dark:hover:text-zinc-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Gallery</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
              activeTab === 'gallery' 
                ? 'bg-[#805D46] dark:bg-zinc-300 text-amber-50 dark:text-zinc-900' 
                : 'bg-stone-200/80 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300'
            }`}>
              {completedCount}/{totalTemplatesCount}
            </span>
          </button>

          {/* AI Generator CTA */}
          <button
            onClick={onOpenAiModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#967259] dark:bg-zinc-800 hover:bg-[#805D46] dark:hover:bg-zinc-700 text-white dark:text-zinc-100 dark:border dark:border-zinc-700 rounded-lg text-sm font-semibold shadow-xs transition-all hover:scale-[1.01]"
          >
            <Sparkles className="w-4 h-4 text-amber-200 dark:text-zinc-300" />
            <span className="hidden md:inline">AI Art</span>
          </button>

          {/* Image Upload CTA */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 rounded-lg text-sm font-semibold border border-stone-300 dark:border-zinc-700 shadow-xs transition-all"
            title="Convert photo to Pixel Art"
          >
            <ImageIcon className="w-4 h-4 text-stone-600 dark:text-zinc-400" />
            <span className="hidden lg:inline">Photo to Pixel</span>
          </button>

          {/* Direct 1-Click Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-stone-600 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-white bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl border border-stone-300 dark:border-zinc-700 transition-all active:scale-95 shadow-xs flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-amber-400 animate-in fade-in zoom-in duration-200" />
            ) : (
              <Moon className="w-5 h-5 text-stone-700 animate-in fade-in zoom-in duration-200" />
            )}
          </button>


          {/* Audio Mute Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 text-stone-500 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-stone-400 dark:text-zinc-500" /> : <Volume2 className="w-5 h-5 text-stone-700 dark:text-zinc-300" />}
          </button>

          {/* Help Instructions Modal Button */}
          <button
            onClick={onOpenHelpModal}
            className="p-2 text-stone-500 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="How to Play & Shortcuts"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

