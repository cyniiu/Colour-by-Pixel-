import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Play, RotateCcw, Trash2, CheckCircle2, Search, Dices, Filter, Palette } from 'lucide-react';
import { PixelArtwork, SavedProgress } from '../types';

interface GalleryViewProps {
  artworks: PixelArtwork[];
  savedProgressMap: Record<string, SavedProgress>;
  onSelectArtwork: (artwork: PixelArtwork) => void;
  onOpenAiModal: () => void;
  onOpenUploadModal: () => void;
  onDeleteCustomArtwork: (id: string) => void;
  onResetArtworkProgress: (id: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  artworks,
  savedProgressMap,
  onSelectArtwork,
  onOpenAiModal,
  onOpenUploadModal,
  onDeleteCustomArtwork,
  onResetArtworkProgress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['All', 'Animals', 'Food', 'Fantasy', 'Nature', 'Pop Culture', 'AI Generated', 'Custom Upload'];

  const filteredArtworks = artworks.filter((art) => {
    // Search query match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchCat = art.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCat) return false;
    }

    // Category match
    const matchCategory = selectedCategory === 'All' || art.category === selectedCategory;
    
    // Difficulty match
    const matchDifficulty = selectedDifficulty === 'All' || art.difficulty === selectedDifficulty;

    // Status match
    const progressData = savedProgressMap[art.id];
    let isCompleted = progressData?.isCompleted || false;
    
    if (progressData && !isCompleted) {
      // Check if partially painted
      let total = 0;
      let painted = 0;
      for (let r = 0; r < art.height; r++) {
        for (let c = 0; c < art.width; c++) {
          if (art.grid[r][c] > 0) {
            total++;
            if (progressData.paintedGrid?.[r]?.[c] === art.grid[r][c]) {
              painted++;
            }
          }
        }
      }
      if (total > 0 && painted >= total) isCompleted = true;
    }

    let matchStatus = true;
    if (selectedStatus === 'Completed') {
      matchStatus = isCompleted;
    } else if (selectedStatus === 'In Progress') {
      matchStatus = !isCompleted && Boolean(progressData);
    }

    return matchCategory && matchDifficulty && matchStatus;
  });

  // Random artwork pick handler
  const handleRandomArtwork = () => {
    const uncompleted = artworks.filter(a => !savedProgressMap[a.id]?.isCompleted);
    const pool = uncompleted.length > 0 ? uncompleted : artworks;
    const randomIndex = Math.floor(Math.random() * pool.length);
    if (pool[randomIndex]) {
      onSelectArtwork(pool[randomIndex]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-800 dark:text-zinc-100">
      
      {/* Top Banner Callouts for AI & Image Upload */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* AI Generator Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xs group hover:border-stone-300 dark:hover:border-zinc-700 transition-all">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/5 dark:bg-zinc-700/10 rounded-full blur-2xl transition-all" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EBE1] dark:bg-zinc-800 text-[#6F523B] dark:text-zinc-300 border border-[#E4D5C7] dark:border-zinc-700">
              <Sparkles className="w-3.5 h-3.5 text-[#967259] dark:text-zinc-300" />
              <span>Gemini AI Studio Engine</span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-zinc-100">Generate Custom AI Pixel Art</h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400">
              Type any prompt like &ldquo;Cute Golden Retriever&rdquo; or &ldquo;Cozy Coffee Cup&rdquo; and Gemini will craft a brand new pixel puzzle!
            </p>
          </div>

          <div className="mt-6 relative z-10">
            <button
              onClick={onOpenAiModal}
              className="px-4 py-2.5 bg-[#967259] dark:bg-zinc-100 hover:bg-[#805D46] dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 hover:scale-[1.01] transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-200 dark:text-zinc-700" />
              <span>Create AI Pixel Artwork</span>
            </button>
          </div>
        </div>

        {/* Photo to Pixel Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-xs group hover:border-stone-300 dark:hover:border-zinc-700 transition-all">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-stone-400/5 dark:bg-zinc-700/10 rounded-full blur-2xl transition-all" />
          
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5EBE1] dark:bg-zinc-800 text-[#6F523B] dark:text-zinc-300 border border-[#E4D5C7] dark:border-zinc-700">
              <ImageIcon className="w-3.5 h-3.5 text-[#967259] dark:text-zinc-300" />
              <span>Image Converter</span>
            </div>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-zinc-100">Turn Any Photo into Color-by-Pixel</h2>
            <p className="text-sm text-stone-600 dark:text-zinc-400">
              Upload your own photo or drawing. Our quantization engine converts it into a pixel color-by-number puzzle.
            </p>
          </div>

          <div className="mt-6 relative z-10">
            <button
              onClick={onOpenUploadModal}
              className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-[#F5EBE1] dark:hover:bg-zinc-700 text-[#5C4033] dark:text-zinc-100 font-bold text-sm rounded-xl border border-[#D0BFB0] dark:border-zinc-700 shadow-xs flex items-center gap-2 hover:scale-[1.01] transition-all"
            >
              <ImageIcon className="w-4 h-4 text-[#967259] dark:text-zinc-300" />
              <span>Upload Photo</span>
            </button>
          </div>
        </div>

      </div>

      {/* Filter & Controls Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-xs space-y-3">
        
        {/* Search & Quick Pick Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search pixel artwork by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#967259] dark:focus:ring-zinc-400 focus:bg-white dark:focus:bg-zinc-800 text-stone-800 dark:text-zinc-100 placeholder-stone-400 dark:placeholder-zinc-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleRandomArtwork}
              className="px-3.5 py-2 bg-[#F5EBE1] dark:bg-zinc-800 hover:bg-[#EAE0D5] dark:hover:bg-zinc-700 text-[#5C4033] dark:text-zinc-200 font-bold text-xs rounded-xl border border-[#D0BFB0] dark:border-zinc-700 flex items-center gap-2 transition-all"
              title="Pick a random uncolored puzzle"
            >
              <Dices className="w-4 h-4 text-[#967259] dark:text-zinc-300" />
              <span>Surprise Me</span>
            </button>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs">
              {(['All', 'In Progress', 'Completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    selectedStatus === status
                      ? 'bg-white dark:bg-zinc-100 text-[#5C4033] dark:text-zinc-900 shadow-xs'
                      : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-stone-100 dark:border-zinc-800 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                    : 'text-stone-600 dark:text-zinc-400 hover:text-[#5C4033] dark:hover:text-zinc-100 hover:bg-[#F5EBE1] dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs min-w-max">
            {['All', 'Easy', 'Medium', 'Hard', 'Expert'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-zinc-100 text-stone-900 dark:text-zinc-900 shadow-xs'
                    : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Empty State */}
      {filteredArtworks.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 p-8 space-y-3">
          <div className="w-12 h-12 bg-[#F5EBE1] dark:bg-zinc-800 text-[#967259] dark:text-zinc-300 rounded-2xl flex items-center justify-center mx-auto">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-stone-800 dark:text-zinc-100 text-base">No pixel artworks found</h3>
          <p className="text-xs text-stone-500 dark:text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search terms or filters, or generate a brand new artwork using AI!
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDifficulty('All');
              setSelectedStatus('All');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-xs"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Artwork Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredArtworks.map((artwork) => {
          const progressData = savedProgressMap[artwork.id];
          let progressPercent = 0;
          let isCompleted = false;

          if (progressData) {
            let total = 0;
            let painted = 0;
            for (let r = 0; r < artwork.height; r++) {
              for (let c = 0; c < artwork.width; c++) {
                if (artwork.grid[r][c] > 0) {
                  total++;
                  if (progressData.paintedGrid?.[r]?.[c] === artwork.grid[r][c]) {
                    painted++;
                  }
                }
              }
            }
            progressPercent = total > 0 ? Math.round((painted / total) * 100) : 0;
            if (progressPercent >= 100) isCompleted = true;
          }

          return (
            <div
              key={artwork.id}
              className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-stone-200 dark:border-zinc-800 hover:border-stone-400 dark:hover:border-zinc-700 p-3 flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {/* Thumbnail Container */}
              <div 
                onClick={() => onSelectArtwork(artwork)}
                className="relative aspect-square w-full rounded-xl bg-stone-100 dark:bg-zinc-800/80 flex items-center justify-center p-2 cursor-pointer overflow-hidden group-hover:bg-stone-200/60 dark:group-hover:bg-zinc-800 transition-colors border border-stone-200 dark:border-zinc-700/60"
              >
                <ArtworkThumbnail artwork={artwork} progressData={progressData} />

                {/* Completed Banner */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 bg-[#967259] dark:bg-zinc-100 text-white dark:text-zinc-900 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-amber-200 dark:text-emerald-700" /> Done
                  </div>
                )}

                {/* Dimension Badge */}
                <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-600 dark:text-zinc-300 border border-stone-200 dark:border-zinc-700">
                  {artwork.width}x{artwork.height}
                </div>
              </div>

              {/* Title & Info */}
              <div className="mt-3 space-y-1">
                <h3 className="font-bold text-sm text-stone-900 dark:text-zinc-100 truncate group-hover:text-[#967259] dark:group-hover:text-zinc-300 transition-colors">
                  {artwork.title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
                  <span>{artwork.category}</span>
                  <span className="font-semibold text-stone-700 dark:text-zinc-300">
                    {artwork.difficulty}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-stone-500 dark:text-zinc-400">
                    <span>Progress</span>
                    <span className="font-mono text-[#6F523B] dark:text-zinc-200 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#E4D5C7] dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#967259] dark:bg-zinc-300 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectArtwork(artwork)}
                  className="flex-1 py-1.5 bg-[#967259] dark:bg-zinc-800 hover:bg-[#805D46] dark:hover:bg-zinc-700 text-white dark:text-zinc-100 font-semibold text-xs rounded-lg dark:border dark:border-zinc-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{progressPercent > 0 ? 'Continue' : 'Paint'}</span>
                </button>

                {progressPercent > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetArtworkProgress(artwork.id);
                    }}
                    className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Reset painting progress"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {artwork.isUserCreated && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomArtwork(artwork.id);
                    }}
                    className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Delete custom artwork"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

// Canvas Thumbnail Generator component
const ArtworkThumbnail: React.FC<{ artwork: PixelArtwork; progressData?: SavedProgress }> = ({ artwork, progressData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;

    const cellW = size / artwork.width;
    const cellH = size / artwork.height;

    const paletteMap = new Map<number, string>();
    artwork.palette.forEach(p => paletteMap.set(p.id, p.hex));

    const isDark = document.documentElement.classList.contains('dark');
    const isCustomImage = artwork.category === 'Custom Upload';

    // Set background fill (light grey in dark mode, white in light mode for standard art)
    ctx.fillStyle = !isCustomImage ? (isDark ? '#D4D4D8' : '#FFFFFF') : (isDark ? '#18181B' : '#EAE6DF');
    ctx.fillRect(0, 0, size, size);

    for (let r = 0; r < artwork.height; r++) {
      for (let c = 0; c < artwork.width; c++) {
        const targetColor = artwork.grid[r][c];
        if (targetColor === 0) {
          if (!isCustomImage) {
            ctx.fillStyle = isDark ? '#D4D4D8' : '#FFFFFF';
            ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          }
          continue;
        }

        const isPainted = progressData?.paintedGrid?.[r]?.[c] === targetColor;

        if (isPainted) {
          ctx.fillStyle = paletteMap.get(targetColor) || '#A8A29E';
        } else {
          // Semi transparent unpainted preview
          ctx.fillStyle = isDark ? 'rgba(82, 82, 91, 0.5)' : 'rgba(180, 170, 160, 0.4)';
        }

        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }, [artwork, progressData]);

  return <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" />;
};
