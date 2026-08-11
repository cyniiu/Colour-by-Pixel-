import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PixelArtwork, SavedProgress, ToolType } from './types';
import { TEMPLATE_ARTWORKS } from './data/templates';
import { soundManager } from './utils/sound';
import { applyPaletteTheme } from './utils/paletteThemes';
import { centerArtworkGrid } from './utils/gridUtils';
import {
  ensureAuthenticated,
  syncProgressToCloud,
  fetchAllProgressFromCloud,
  deleteProgressFromCloud,
  saveCustomArtworkToCloud,
  fetchCustomArtworksFromCloud,
  deleteCustomArtworkFromCloud,
} from './lib/firebase';

import { Navbar } from './components/Navbar';
import { GalleryView } from './components/GalleryView';
import { PixelCanvas } from './components/PixelCanvas';
import { PaletteBar } from './components/PaletteBar';
import { AiGeneratorModal } from './components/AiGeneratorModal';
import { ImageConverterModal } from './components/ImageConverterModal';
import { VictoryModal } from './components/VictoryModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  // Dark Mode State (simple boolean toggle between Light and Dark mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pixel_dark_mode_active');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      // Check initial system default if first load
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {
      // fallback
    }
    return false;
  });

  // Sync dark class on document root element for Tailwind CSS
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('pixel_dark_mode_active', JSON.stringify(isDarkMode));
    } catch {
      // fallback
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Navigation & View tab
  const [activeTab, setActiveTab] = useState<'gallery' | 'editor'>('gallery');

  // Firebase Auth User ID for Cloud Sync
  const [userId, setUserId] = useState<string | null>(null);

  // Custom AI / Uploaded Artworks
  const [customArtworks, setCustomArtworks] = useState<PixelArtwork[]>(() => {
    try {
      const saved = localStorage.getItem('custom_pixel_artworks_v1');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((art: PixelArtwork) => ({
        ...art,
        grid: centerArtworkGrid(art.grid),
      }));
    } catch {
      return [];
    }
  });

  // All combined Artworks (Templates + Custom)
  const allArtworks = useMemo(() => {
    return [...TEMPLATE_ARTWORKS, ...customArtworks];
  }, [customArtworks]);

  // Selected Active Artwork in Editor
  const [activeArtwork, setActiveArtwork] = useState<PixelArtwork>(TEMPLATE_ARTWORKS[0]);

  // Active Palette Theme ('original', 'pastel', 'neon', 'autumn', 'ocean', 'vintage')
  const [activeThemeId, setActiveThemeId] = useState<string>('original');

  // Displayed Artwork with palette remapped by theme
  const displayedArtwork = useMemo(() => {
    if (!activeArtwork) return TEMPLATE_ARTWORKS[0];
    if (activeThemeId === 'original') return activeArtwork;
    return {
      ...activeArtwork,
      palette: applyPaletteTheme(activeArtwork.palette, activeThemeId),
    };
  }, [activeArtwork, activeThemeId]);

  // Saved Progress per artwork
  const [savedProgressMap, setSavedProgressMap] = useState<Record<string, SavedProgress>>(() => {
    try {
      const saved = localStorage.getItem('pixel_progress_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Initialize Firebase Auth & Cloud Sync
  useEffect(() => {
    const unsubscribe = ensureAuthenticated(async (user) => {
      setUserId(user.uid);

      // Load custom artworks from cloud
      try {
        const cloudCustom = await fetchCustomArtworksFromCloud(user.uid);
        if (cloudCustom.length > 0) {
          setCustomArtworks((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newArtworks = cloudCustom.filter((a) => !existingIds.has(a.id));
            return [...newArtworks, ...prev];
          });
        }
      } catch (e) {
        console.error('Cloud custom artworks sync failed:', e);
      }

      // Load progress map from cloud
      try {
        const cloudProgressMap = await fetchAllProgressFromCloud(user.uid);
        if (Object.keys(cloudProgressMap).length > 0) {
          setSavedProgressMap((prev) => {
            const merged = { ...prev, ...cloudProgressMap };
            try {
              localStorage.setItem('pixel_progress_v1', JSON.stringify(merged));
            } catch {
              // fallback
            }
            return merged;
          });
        }
      } catch (e) {
        console.error('Cloud progress sync failed:', e);
      }
    });

    return () => unsubscribe();
  }, []);

  // Editor State
  const [paintedGrid, setPaintedGrid] = useState<number[][]>(() => {
    const existing = savedProgressMap[activeArtwork.id];
    if (existing?.paintedGrid) return existing.paintedGrid;
    return Array.from({ length: activeArtwork.height }, () => Array(activeArtwork.width).fill(0));
  });

  // Undo History Stack
  const [history, setHistory] = useState<number[][][]>([]);

  // Palette & Tools
  const [selectedColorId, setSelectedColorId] = useState<number>(1);
  const [selectedTool, setSelectedTool] = useState<ToolType>('brush');
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);

  // Save custom artworks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('custom_pixel_artworks_v1', JSON.stringify(customArtworks));
    } catch {
      // localStorage quota safeguard
    }
  }, [customArtworks]);

  // Save progress to localStorage and Cloud whenever paintedGrid changes
  useEffect(() => {
    if (!activeArtwork) return;

    let total = 0;
    let painted = 0;

    for (let r = 0; r < activeArtwork.height; r++) {
      for (let c = 0; c < activeArtwork.width; c++) {
        if (activeArtwork.grid[r][c] > 0) {
          total++;
          if (paintedGrid[r]?.[c] === activeArtwork.grid[r][c]) {
            painted++;
          }
        }
      }
    }

    const isCompleted = total > 0 && painted >= total;

    const progressItem: SavedProgress = {
      paintedGrid,
      isCompleted,
      timeSpentSeconds: (savedProgressMap[activeArtwork.id]?.timeSpentSeconds || 0) + 1,
      lastModified: Date.now(),
    };

    setSavedProgressMap((prev) => {
      const nextMap = {
        ...prev,
        [activeArtwork.id]: progressItem,
      };

      try {
        localStorage.setItem('pixel_progress_v1', JSON.stringify(nextMap));
      } catch {
        // storage fallback
      }

      return nextMap;
    });

    if (userId) {
      syncProgressToCloud(userId, activeArtwork.id, progressItem);
    }
  }, [paintedGrid, activeArtwork, userId]);

  // Open & Select Artwork for painting
  const handleSelectArtwork = (artwork: PixelArtwork) => {
    setActiveArtwork(artwork);
    setActiveThemeId('original');
    const existing = savedProgressMap[artwork.id];

    if (existing?.isCompleted) {
      setPaintedGrid(artwork.grid.map((row) => [...row]));
    } else if (existing?.paintedGrid) {
      setPaintedGrid(existing.paintedGrid);
    } else {
      setPaintedGrid(Array.from({ length: artwork.height }, () => Array(artwork.width).fill(0)));
    }

    setHistory([]);
    setSelectedColorId(artwork.palette[0]?.id || 1);
    setSelectedTool('brush');
    setZoomScale(1.0);
    setActiveTab('editor');
  };

  // Complete single artwork
  const handleCompleteArtwork = useCallback((artworkId: string) => {
    const targetArt = allArtworks.find((a) => a.id === artworkId);
    if (!targetArt) return;

    const completedGrid = targetArt.grid.map((row) => [...row]);
    const progressItem: SavedProgress = {
      paintedGrid: completedGrid,
      isCompleted: true,
      timeSpentSeconds: (savedProgressMap[artworkId]?.timeSpentSeconds || 0) + 60,
      lastModified: Date.now(),
    };

    setSavedProgressMap((prev) => {
      const nextMap = { ...prev, [artworkId]: progressItem };
      try {
        localStorage.setItem('pixel_progress_v1', JSON.stringify(nextMap));
      } catch {}
      return nextMap;
    });

    if (activeArtwork?.id === artworkId) {
      setPaintedGrid(completedGrid);
    }

    if (userId) {
      syncProgressToCloud(userId, artworkId, progressItem);
    }
  }, [allArtworks, savedProgressMap, activeArtwork, userId]);

  // Complete ALL artworks
  const handleCompleteAllArtworks = useCallback(() => {
    const nextMap: Record<string, SavedProgress> = { ...savedProgressMap };

    allArtworks.forEach((art) => {
      const completedGrid = art.grid.map((row) => [...row]);
      const progressItem: SavedProgress = {
        paintedGrid: completedGrid,
        isCompleted: true,
        timeSpentSeconds: (savedProgressMap[art.id]?.timeSpentSeconds || 0) + 60,
        lastModified: Date.now(),
      };
      nextMap[art.id] = progressItem;

      if (userId) {
        syncProgressToCloud(userId, art.id, progressItem);
      }
    });

    setSavedProgressMap(nextMap);
    try {
      localStorage.setItem('pixel_progress_v1', JSON.stringify(nextMap));
    } catch {}

    if (activeArtwork) {
      setPaintedGrid(activeArtwork.grid.map((row) => [...row]));
    }
  }, [allArtworks, savedProgressMap, activeArtwork, userId]);

  // Reset progress for ALL artworks
  const handleResetAllProgress = useCallback(() => {
    setSavedProgressMap({});
    try {
      localStorage.removeItem('pixel_progress_v1');
    } catch {}

    if (activeArtwork) {
      setPaintedGrid(Array.from({ length: activeArtwork.height }, () => Array(activeArtwork.width).fill(0)));
    }
  }, [activeArtwork]);

  // Clean reset on mount to ensure all artworks start with fresh 0% progress
  useEffect(() => {
    try {
      localStorage.removeItem('pixel_progress_v1');
    } catch {}
    setSavedProgressMap({});
  }, []);

  // Record undo history
  const handleRecordHistory = useCallback((grid: number[][]) => {
    setHistory((prev) => [...prev.slice(-20), grid]); // Keep last 20 states
  }, []);

  // Undo last painting action
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPaintedGrid(previous);
  };

  // Reset progress for artwork
  const handleResetArtworkProgress = (artworkId: string) => {
    setSavedProgressMap((prev) => {
      const nextMap = { ...prev };
      delete nextMap[artworkId];
      try {
        localStorage.setItem('pixel_progress_v1', JSON.stringify(nextMap));
      } catch {
        // storage fallback
      }
      return nextMap;
    });

    if (userId) {
      deleteProgressFromCloud(userId, artworkId);
    }

    if (activeArtwork.id === artworkId) {
      setPaintedGrid(Array.from({ length: activeArtwork.height }, () => Array(activeArtwork.width).fill(0)));
      setHistory([]);
    }
  };

  // Delete Custom Artwork
  const handleDeleteCustomArtwork = (artworkId: string) => {
    setCustomArtworks((prev) => prev.filter((art) => art.id !== artworkId));
    handleResetArtworkProgress(artworkId);

    if (userId) {
      deleteCustomArtworkFromCloud(userId, artworkId);
    }

    if (activeArtwork.id === artworkId) {
      setActiveArtwork(TEMPLATE_ARTWORKS[0]);
      setActiveTab('gallery');
    }
  };

  // On Artwork Generated by AI or Photo
  const handleArtworkGenerated = (rawArtwork: PixelArtwork) => {
    const newArtwork: PixelArtwork = {
      ...rawArtwork,
      grid: centerArtworkGrid(rawArtwork.grid),
    };
    setCustomArtworks((prev) => [newArtwork, ...prev]);

    if (userId) {
      saveCustomArtworkToCloud(userId, newArtwork);
    }

    handleSelectArtwork(newArtwork);
  };

  // Calculate pixel counts per color for active artwork
  const pixelCounts = useMemo(() => {
    const counts: Record<number, { total: number; painted: number }> = {};

    displayedArtwork.palette.forEach((p) => {
      counts[p.id] = { total: 0, painted: 0 };
    });

    for (let r = 0; r < displayedArtwork.height; r++) {
      for (let c = 0; c < displayedArtwork.width; c++) {
        const targetColor = displayedArtwork.grid[r][c];
        if (targetColor > 0) {
          if (!counts[targetColor]) counts[targetColor] = { total: 0, painted: 0 };
          counts[targetColor].total++;
          if (paintedGrid[r]?.[c] === targetColor) {
            counts[targetColor].painted++;
          }
        }
      }
    }

    return counts;
  }, [displayedArtwork, paintedGrid]);

  // Overall artwork progress percentage
  const overallProgress = useMemo(() => {
    let total = 0;
    let painted = 0;

    for (let r = 0; r < displayedArtwork.height; r++) {
      for (let c = 0; c < displayedArtwork.width; c++) {
        if (displayedArtwork.grid[r][c] > 0) {
          total++;
          if (paintedGrid[r]?.[c] === displayedArtwork.grid[r][c]) {
            painted++;
          }
        }
      }
    }

    return total > 0 ? Math.round((painted / total) * 100) : 0;
  }, [displayedArtwork, paintedGrid]);

  // Completed templates count
  const completedTemplatesCount = useMemo(() => {
    return (Object.values(savedProgressMap) as SavedProgress[]).filter((p: SavedProgress) => p.isCompleted).length;
  }, [savedProgressMap]);

  // Next artwork handler on victory
  const handleNextArtwork = () => {
    setIsVictoryModalOpen(false);
    const currentIndex = allArtworks.findIndex((art) => art.id === activeArtwork.id);
    const nextArt = allArtworks[(currentIndex + 1) % allArtworks.length];
    handleSelectArtwork(nextArt);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#7F7C79] text-stone-800 dark:text-zinc-100 flex flex-col font-sans selection:bg-stone-700 selection:text-white transition-colors duration-300">
      
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        completedCount={completedTemplatesCount}
        totalTemplatesCount={allArtworks.length}
        activeArtworkTitle={displayedArtwork.title}
        artworkProgress={overallProgress}
        isCloudSynced={Boolean(userId)}
      />

      {/* Main Content Body */}
      <main className="flex-1 relative">
        {activeTab === 'gallery' ? (
          <GalleryView
            artworks={allArtworks}
            savedProgressMap={savedProgressMap}
            onSelectArtwork={handleSelectArtwork}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onDeleteCustomArtwork={handleDeleteCustomArtwork}
            onResetArtworkProgress={handleResetArtworkProgress}
            onCompleteArtwork={handleCompleteArtwork}
            onCompleteAllArtworks={handleCompleteAllArtworks}
            onResetAllProgress={handleResetAllProgress}
          />
        ) : (
          <div className="relative w-full h-full pb-28">
            <PixelCanvas
              artwork={displayedArtwork}
              paintedGrid={paintedGrid}
              setPaintedGrid={setPaintedGrid}
              selectedColorId={selectedColorId}
              setSelectedColorId={setSelectedColorId}
              selectedTool={selectedTool}
              onRecordHistory={handleRecordHistory}
              zoomScale={zoomScale}
              setZoomScale={setZoomScale}
              onCompleteArtwork={() => setIsVictoryModalOpen(true)}
            />

            {/* Bottom Palette & Controls Bar */}
            <PaletteBar
              palette={displayedArtwork.palette}
              selectedColorId={selectedColorId}
              setSelectedColorId={setSelectedColorId}
              selectedTool={selectedTool}
              setSelectedTool={setSelectedTool}
              pixelCounts={pixelCounts}
              onUndo={handleUndo}
              canUndo={history.length > 0}
              onZoomIn={() => setZoomScale((prev) => Math.min(6.0, prev * 1.2))}
              onZoomOut={() => setZoomScale((prev) => Math.max(0.5, prev * 0.8))}
              onResetZoom={() => setZoomScale(1.0)}
              onUseMagicWand={() => setSelectedTool('magic_wand')}
              activeThemeId={activeThemeId}
              onSelectTheme={setActiveThemeId}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onArtworkGenerated={handleArtworkGenerated}
      />

      <ImageConverterModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onArtworkCreated={handleArtworkGenerated}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <VictoryModal
        isOpen={isVictoryModalOpen}
        artwork={displayedArtwork}
        onNextArtwork={handleNextArtwork}
        onBackToGallery={() => {
          setIsVictoryModalOpen(false);
          setActiveTab('gallery');
        }}
      />

    </div>
  );
}
