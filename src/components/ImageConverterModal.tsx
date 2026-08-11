import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles, SlidersHorizontal, Crop, Maximize } from 'lucide-react';
import { PixelArtwork } from '../types';
import { convertImageToPixelArt } from '../utils/imageToPixel';

interface ImageConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArtworkCreated: (artwork: PixelArtwork) => void;
}

export const ImageConverterModal: React.FC<ImageConverterModalProps> = ({
  isOpen,
  onClose,
  onArtworkCreated,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);
  const [title, setTitle] = useState('');
  
  // Custom sizing controls
  const [gridSize, setGridSize] = useState<number>(28);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [maxColors, setMaxColors] = useState<number>(12);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);

      // Measure original image dimensions for aspect ratio calculation
      const img = new Image();
      img.onload = () => {
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Compute final grid target dimensions
  const getComputedDimensions = () => {
    if (!imgDimensions || !keepAspectRatio) {
      return { targetWidth: gridSize, targetHeight: gridSize };
    }

    const { width: origW, height: origH } = imgDimensions;
    const aspect = origW / origH;

    if (aspect >= 1) {
      // Landscape or square
      const w = gridSize;
      const h = Math.max(8, Math.round(gridSize / aspect));
      return { targetWidth: w, targetHeight: h };
    } else {
      // Portrait
      const h = gridSize;
      const w = Math.max(8, Math.round(gridSize * aspect));
      return { targetWidth: w, targetHeight: h };
    }
  };

  const { targetWidth, targetHeight } = getComputedDimensions();
  const totalPixels = targetWidth * targetHeight;
  const maxDim = Math.max(targetWidth, targetHeight);
  const difficultyRating = maxDim <= 16 ? 'Easy' : maxDim <= 28 ? 'Medium' : maxDim <= 48 ? 'Hard' : 'Expert';

  const handleConvert = async () => {
    if (!file) {
      setErrorMsg('Please upload an image first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const artwork = await convertImageToPixelArt(
        file,
        targetWidth,
        targetHeight,
        maxColors,
        title.trim() || 'My Photo Puzzle',
        !keepAspectRatio // crop to square if not keeping aspect ratio
      );

      onArtworkCreated(artwork);
      onClose();
      setFile(null);
      setPreviewUrl(null);
      setImgDimensions(null);
    } catch (err: unknown) {
      console.error('Image Conversion Error:', err);
      const msg = err instanceof Error ? err.message : 'Image processing failed.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-xl p-6 text-stone-800 dark:text-zinc-100 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F5EBE1] dark:bg-zinc-800 text-[#6F523B] dark:text-zinc-300 border border-[#E4D5C7] dark:border-zinc-700">
              <ImageIcon className="w-5 h-5 text-[#967259] dark:text-zinc-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-stone-900 dark:text-zinc-100">Photo to Pixel Converter</h2>
              <p className="text-xs text-stone-500 dark:text-zinc-400">Transform photos or custom art into pixel puzzles</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-stone-800 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone or Preview */}
        {!previewUrl ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 dark:border-zinc-700 hover:border-[#967259] dark:hover:border-zinc-400 rounded-2xl p-8 text-center bg-stone-50 dark:bg-zinc-800/50 hover:bg-[#F5EBE1]/40 dark:hover:bg-zinc-800 cursor-pointer transition-all space-y-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <div className="w-12 h-12 rounded-2xl bg-[#F5EBE1] dark:bg-zinc-800 text-[#967259] dark:text-zinc-300 group-hover:bg-[#967259] dark:group-hover:bg-zinc-100 group-hover:text-white dark:group-hover:text-zinc-900 flex items-center justify-center mx-auto transition-colors shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-stone-900 dark:text-zinc-100">Click or Drag Image Here</p>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">Supports PNG, JPG, WebP up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-3 bg-stone-50 dark:bg-zinc-800/80 border border-stone-200 dark:border-zinc-700 rounded-2xl">
            <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-stone-200 dark:border-zinc-700 flex-shrink-0" />
            <div className="flex-1 space-y-1 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Artwork Title"
                className="w-full bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 focus:border-[#967259] dark:focus:border-zinc-400 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 dark:text-zinc-100 focus:outline-none"
              />
              <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-zinc-400">
                <span className="truncate">{file?.name}</span>
                {imgDimensions && (
                  <span className="font-mono bg-stone-200 dark:bg-zinc-700 text-stone-700 dark:text-zinc-200 px-1.5 py-0.5 rounded text-[10px]">
                    {imgDimensions.width}×{imgDimensions.height}px
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setImgDimensions(null);
              }}
              className="p-1.5 text-stone-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 pt-1">
          
          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
              <span>Grid Size Presets</span>
              <span className="text-[11px] text-[#6F523B] dark:text-zinc-200 font-mono font-bold">Base: {gridSize}px</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { size: 16, label: '16x16', desc: 'Mini' },
                { size: 24, label: '24x24', desc: 'Standard' },
                { size: 32, label: '32x32', desc: 'Medium' },
                { size: 48, label: '48x48', desc: 'Detail' },
                { size: 64, label: '64x64', desc: 'HD Master' },
              ].map((opt) => (
                <button
                  key={opt.size}
                  type="button"
                  onClick={() => setGridSize(opt.size)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all ${
                    gridSize === opt.size
                      ? 'bg-[#967259] dark:bg-zinc-100 border-[#967259] dark:border-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-stone-50 dark:bg-zinc-800 border-stone-200 dark:border-zinc-700 text-stone-700 dark:text-zinc-300 hover:border-stone-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] opacity-80">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tuning Slider for Grid Size */}
          <div className="space-y-1.5 bg-stone-50 dark:bg-zinc-800/80 p-3 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 dark:text-zinc-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#967259] dark:text-zinc-300" />
                Custom Grid Size Slider
              </span>
              <span className="font-mono text-[#6F523B] dark:text-zinc-200 font-extrabold">{gridSize} px</span>
            </div>
            <input
              type="range"
              min="12"
              max="80"
              step="2"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full accent-[#967259] dark:accent-zinc-100 bg-stone-200 dark:bg-zinc-700 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
              <span>12px (Tiny)</span>
              <span>32px</span>
              <span>80px (Ultra Detailed)</span>
            </div>
          </div>

          {/* Aspect Ratio Mode */}
          <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-800/80 rounded-xl border border-stone-200 dark:border-zinc-700">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-stone-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer">
                {keepAspectRatio ? (
                  <Maximize className="w-3.5 h-3.5 text-[#967259] dark:text-zinc-300" />
                ) : (
                  <Crop className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
                )}
                <span>Preserve Photo Aspect Ratio</span>
              </label>
              <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                {keepAspectRatio
                  ? 'Maintains original photo width & height proportions'
                  : 'Crop center into a 1:1 square canvas'}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setKeepAspectRatio((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                keepAspectRatio ? 'bg-[#967259] dark:bg-zinc-100' : 'bg-stone-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition duration-200 ease-in-out ${
                  keepAspectRatio ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Computed Dimensions Summary Badge */}
          <div className="p-3 bg-[#F5EBE1] dark:bg-zinc-800 border border-[#E4D5C7] dark:border-zinc-700 rounded-xl flex items-center justify-between text-xs text-[#5C4033] dark:text-zinc-200">
            <div className="flex items-center gap-2 font-mono">
              <span className="font-extrabold text-sm text-[#6F523B] dark:text-zinc-100">
                {targetWidth} × {targetHeight}
              </span>
              <span className="text-stone-500 dark:text-zinc-400">({totalPixels.toLocaleString()} cells)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-zinc-900 text-[#6F523B] dark:text-zinc-200 border border-[#D0BFB0] dark:border-zinc-700">
              {difficultyRating}
            </span>
          </div>

          {/* Color Count Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold text-stone-700 dark:text-zinc-300 uppercase tracking-wider">Color Palette Size</label>
              <span className="font-mono text-[#6F523B] dark:text-zinc-200 font-extrabold">{maxColors} Colors</span>
            </div>
            <input
              type="range"
              min="4"
              max="24"
              step="1"
              value={maxColors}
              onChange={(e) => setMaxColors(Number(e.target.value))}
              className="w-full accent-[#967259] dark:accent-zinc-100 bg-stone-200 dark:bg-zinc-700 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 dark:text-zinc-500 font-mono">
              <span>4 Colors (Simple)</span>
              <span>12 Colors</span>
              <span>24 Colors (Rich Spectrum)</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleConvert}
            disabled={!file || isProcessing}
            className="px-5 py-2.5 bg-[#967259] dark:bg-zinc-100 hover:bg-[#805D46] dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Quantizing Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Convert to Puzzle</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
