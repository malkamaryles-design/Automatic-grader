import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ScanText,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  SunMedium,
  Code2,
  FileText,
  Bookmark,
  Check,
  Copy,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
} from 'lucide-react';
import { ExamImage, DetectedOcrRegion } from '../types/evaluation';
import { prepareOcrRegions, getRegionColorStyles } from '../utils/ocrRegions';

interface VisualOcrViewerProps {
  images: ExamImage[];
  detectedRegions?: DetectedOcrRegion[];
  transcription?: {
    code: string;
    hebrewProse?: string;
    rawText?: string;
  };
  problemTitle?: string;
  detectedLanguage?: string;
  onSelectRegion?: (region: DetectedOcrRegion) => void;
  className?: string;
}

export const VisualOcrViewer: React.FC<VisualOcrViewerProps> = ({
  images,
  detectedRegions,
  detectedLanguage,
  onSelectRegion,
  className = '',
}) => {
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [filterType, setFilterType] = useState<
    'all' | 'handwritten_code' | 'handwritten_note' | 'printed_question'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pencilEnhance, setPencilEnhance] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const listItemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const currentImage = images[selectedPageIndex] || images[0];

  // Process and sanitize genuine detected regions
  const allRegions = useMemo(() => {
    return prepareOcrRegions(detectedRegions);
  }, [detectedRegions]);

  // Filter by selected page
  const pageRegions = useMemo(() => {
    return allRegions.filter((reg) => (reg.imageIndex ?? 0) === selectedPageIndex);
  }, [allRegions, selectedPageIndex]);

  const filteredRegions = useMemo(() => {
    return pageRegions.filter((reg) => {
      let matchType = true;
      if (filterType === 'handwritten_code') {
        matchType = reg.type === 'handwritten_code' || reg.type === 'code';
      } else if (filterType === 'handwritten_note') {
        matchType =
          reg.type === 'handwritten_note' ||
          reg.type === 'hebrew_text' ||
          reg.type === 'comment';
      } else if (filterType === 'printed_question') {
        matchType = reg.type === 'printed_question' || reg.type === 'title';
      }

      const matchQuery =
        !searchQuery.trim() ||
        reg.text.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchType && matchQuery;
    });
  }, [pageRegions, filterType, searchQuery]);

  // Selected region object
  const activeRegion = useMemo(() => {
    if (!activeRegionId) return null;
    return pageRegions.find((r) => r.id === activeRegionId) || null;
  }, [pageRegions, activeRegionId]);

  // Index of selected region in filtered list
  const activeRegionIndex = useMemo(() => {
    if (!activeRegionId) return -1;
    return filteredRegions.findIndex((r) => r.id === activeRegionId);
  }, [filteredRegions, activeRegionId]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: pageRegions.length,
      studentCode: pageRegions.filter(
        (r) => r.type === 'handwritten_code' || r.type === 'code'
      ).length,
      notes: pageRegions.filter(
        (r) =>
          r.type === 'handwritten_note' ||
          r.type === 'hebrew_text' ||
          r.type === 'comment'
      ).length,
      printed: pageRegions.filter(
        (r) => r.type === 'printed_question' || r.type === 'title'
      ).length,
    };
  }, [pageRegions]);

  const handleCopyText = (text: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegionClick = (region: DetectedOcrRegion) => {
    setActiveRegionId(region.id === activeRegionId ? null : region.id);
    if (onSelectRegion) {
      onSelectRegion(region);
    }

    // Scroll to item in sidebar list if present
    const el = listItemsRef.current[region.id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const navigateRegion = (direction: 'next' | 'prev') => {
    if (filteredRegions.length === 0) return;
    let nextIdx = 0;
    if (activeRegionIndex !== -1) {
      if (direction === 'next') {
        nextIdx = (activeRegionIndex + 1) % filteredRegions.length;
      } else {
        nextIdx = (activeRegionIndex - 1 + filteredRegions.length) % filteredRegions.length;
      }
    }
    const targetRegion = filteredRegions[nextIdx];
    if (targetRegion) {
      handleRegionClick(targetRegion);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (activeRegionId) {
          setActiveRegionId(null);
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (activeRegionId) {
          navigateRegion('next');
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (activeRegionId) {
          navigateRegion('prev');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, activeRegionId, activeRegionIndex, filteredRegions]);

  if (!currentImage) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        לא נמצאה תמונת מקור להצגת זיהוי ה-OCR.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4' : className
      }`}
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-300">
        {/* Left/Start: Title, Granular Count, and Page Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ScanText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <span>מפת זיהוי OCR פרטנית (מיכל נפרד לכל פריט)</span>
                {detectedLanguage && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                    {detectedLanguage}
                  </span>
                )}
              </span>
              <span className="text-slate-400 text-[11px] block">
                כל שורה, הערה וביטוי מתוחמים בריבוע עצמאי עם זיהוי ייעודי
              </span>
            </div>
          </div>

          {/* Multiple Page Switcher */}
          {images.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-slate-400 px-2">עמוד:</span>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedPageIndex(i);
                    setActiveRegionId(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                    selectedPageIndex === i
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right/End: Display Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Bounding Boxes Overlay */}
          <button
            onClick={() => setShowOverlays((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
              showOverlays
                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="הצג או הסתר את כל הריבועים והמיכלים"
          >
            {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showOverlays ? `מיכלים פעילים (${pageRegions.length})` : 'הסתר ריבועים'}</span>
          </button>

          {/* Toggle Mini Tags */}
          {showOverlays && (
            <button
              onClick={() => setShowTags((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition ${
                showTags
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title="הצג/הסתר תוויות מספר שורה מעל כל ריבוע"
            >
              <Bookmark className="w-3 h-3" />
              <span>תוויות שורה</span>
            </button>
          )}

          {/* Pencil Booster */}
          <button
            onClick={() => setPencilEnhance((prev) => !prev)}
            className={`p-2 rounded-xl border transition ${
              pencilEnhance
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="הבלטת כתב יד בעיפרון (הגברת ניגודיות)"
          >
            <SunMedium className="w-4 h-4" />
          </button>

          {/* Rotate */}
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="סובב 90 מעלות"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5">
            <button
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="הגדל"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="הקטן"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title={isFullscreen ? 'יציאה ממסך מלא' : 'מסך מלא'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main View Area: Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[580px] overflow-hidden">
        {/* Left/Image Canvas (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-950 flex flex-col items-center justify-between p-4 relative overflow-auto border-b lg:border-b-0 lg:border-l border-slate-800">
          {/* Legend Banner */}
          {showOverlays && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-lg">
              <span className="flex items-center gap-1.5 font-medium text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                <span>פתרון בכתב יד ({counts.studentCode})</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 font-medium text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/50" />
                <span>הערות שוליים ({counts.notes})</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <span className="w-2.5 h-2.5 rounded border border-slate-400 border-dashed" />
                <span>שאלון מודפס ({counts.printed})</span>
              </span>
            </div>
          )}

          {/* Container holding the Image + Bounding Boxes */}
          <div className="my-auto flex items-center justify-center w-full py-4">
            <div
              className="relative transition-transform duration-200 select-none shadow-2xl"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: isFullscreen ? '80vh' : '68vh',
              }}
            >
              {/* The Original Exam Page Image */}
              <img
                src={currentImage.dataUrl}
                alt={currentImage.name}
                style={{
                  filter: pencilEnhance
                    ? 'contrast(175%) brightness(90%) grayscale(70%)'
                    : 'none',
                }}
                className="max-h-[68vh] w-auto object-contain rounded-xl block border border-slate-800"
              />

              {/* OVERLAY: Individual Granular Bounding Box Containers */}
              {showOverlays &&
                pageRegions.map((region) => {
                  const [ymin, xmin, ymax, xmax] = region.box2d;
                  const topPct = (ymin / 1000) * 100;
                  const leftPct = (xmin / 1000) * 100;
                  const heightPct = Math.max(1.5, ((ymax - ymin) / 1000) * 100);
                  const widthPct = Math.max(3.5, ((xmax - xmin) / 1000) * 100);

                  const isSelected = activeRegionId === region.id;
                  const isHovered = hoveredRegionId === region.id;
                  const styles = getRegionColorStyles(region.type);

                  // Check if region matches current filter
                  const matchesFilter = filteredRegions.some((r) => r.id === region.id);
                  const isDimmed = filterType !== 'all' && !matchesFilter;

                  return (
                    <div
                      key={region.id}
                      onClick={() => handleRegionClick(region)}
                      onMouseEnter={() => setHoveredRegionId(region.id)}
                      onMouseLeave={() => setHoveredRegionId(null)}
                      style={{
                        top: `${topPct}%`,
                        left: `${leftPct}%`,
                        height: `${heightPct}%`,
                        width: `${widthPct}%`,
                        opacity: isDimmed ? 0.2 : 1,
                      }}
                      className={`absolute z-10 cursor-pointer rounded transition-all duration-150 border-2 ${
                        isSelected
                          ? `${styles.activeBorder} ${styles.activeBg} z-30 ring-4 ring-offset-1 ring-offset-slate-950`
                          : isHovered
                          ? `ring-2 ring-white/90 ${styles.activeBg} z-20`
                          : `${styles.border} ${styles.bg} hover:border-white/90`
                      }`}
                    >
                      {/* Mini Tag Badge */}
                      {showTags && !isDimmed && (
                        <div
                          className={`absolute -top-3.5 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap flex items-center gap-1 ${styles.badgeBg}`}
                        >
                          {region.type === 'handwritten_code' || region.type === 'code' ? (
                            <Code2 className="w-2.5 h-2.5" />
                          ) : (
                            <FileText className="w-2.5 h-2.5" />
                          )}
                          <span>
                            {region.lineNumber
                              ? `שורה ${region.lineNumber}`
                              : styles.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* DEDICATED ATOMIC CONTAINER INSPECTOR BAR */}
          {activeRegion ? (
            <div
              className="w-full mt-3 bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right animate-fadeIn"
              dir="rtl"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">
                      מיכל נבחר {activeRegionIndex !== -1 ? `#${activeRegionIndex + 1}` : ''}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        getRegionColorStyles(activeRegion.type).badgeBg
                      }`}
                    >
                      {getRegionColorStyles(activeRegion.type).label}
                      {activeRegion.lineNumber ? ` (שורה ${activeRegion.lineNumber})` : ''}
                    </span>
                    {activeRegion.confidence && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        דיוק: {activeRegion.confidence}%
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xs font-mono text-emerald-200 mt-1 max-w-xl truncate"
                    dir={
                      activeRegion.type === 'handwritten_code' || activeRegion.type === 'code'
                        ? 'ltr'
                        : 'rtl'
                    }
                  >
                    {activeRegion.text}
                  </div>
                </div>
              </div>

              {/* Inspector Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {/* Previous container */}
                <button
                  onClick={() => navigateRegion('prev')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="מיכל קודם (חץ למעלה)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Next container */}
                <button
                  onClick={() => navigateRegion('next')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                  title="מיכל הבא (חץ למטה)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {/* Copy container text */}
                <button
                  onClick={(e) => handleCopyText(activeRegion.text, activeRegion.id, e)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700 transition flex items-center gap-1"
                  title="העתק טקסט של מיכל זה"
                >
                  {copiedId === activeRegion.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>הועתק!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>העתק</span>
                    </>
                  )}
                </button>
                {/* Close Inspector */}
                <button
                  onClick={() => setActiveRegionId(null)}
                  className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white transition"
                  title="סגור מפקח"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full mt-2 py-2 px-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>לחץ על כל ריבוע/מיכל בדף לצפייה בתוכנו המדויק ובזיהוי הנפרד שלו</span>
              </span>
              <span className="font-mono text-slate-500">
                סה״כ {filteredRegions.length} מיכלים בדף
              </span>
            </div>
          )}
        </div>

        {/* Right/Synchronized OCR Inspection List (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900/95 flex flex-col border-t lg:border-t-0 border-slate-800 overflow-hidden">
          {/* Search & Category Filter Header */}
          <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>מיכלי זיהוי נפרדים ({filteredRegions.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">
                לחץ למיקוד בריבוע
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי תוכן המיכל..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                dir="rtl"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute top-2.5 right-2.5" />
            </div>

            {/* Filter pills for containers */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                כל המיכלים ({counts.all})
              </button>
              <button
                onClick={() => setFilterType('handwritten_code')}
                className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                  filterType === 'handwritten_code'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-emerald-300'
                }`}
              >
                פתרון בכתב יד ({counts.studentCode})
              </button>
              {counts.notes > 0 && (
                <button
                  onClick={() => setFilterType('handwritten_note')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                    filterType === 'handwritten_note'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-amber-300'
                  }`}
                >
                  הערות שוליים ({counts.notes})
                </button>
              )}
              {counts.printed > 0 && (
                <button
                  onClick={() => setFilterType('printed_question')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium whitespace-nowrap ${
                    filterType === 'printed_question'
                      ? 'bg-slate-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  שאלון מודפס ({counts.printed})
                </button>
              )}
            </div>
          </div>

          {/* List of Detected Individual Containers */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[520px]">
            {filteredRegions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                לא נמצאו מיכלי OCR התואמים לסינון זה.
              </div>
            ) : (
              filteredRegions.map((region, idx) => {
                const isSelected = activeRegionId === region.id;
                const isHovered = hoveredRegionId === region.id;
                const styles = getRegionColorStyles(region.type);

                return (
                  <div
                    key={region.id}
                    ref={(el) => {
                      listItemsRef.current[region.id] = el;
                    }}
                    onClick={() => handleRegionClick(region)}
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onMouseLeave={() => setHoveredRegionId(null)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-right group ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : isHovered
                        ? 'bg-slate-800/80 border-slate-700'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-400 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          מיכל #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${styles.badgeBg}`}
                        >
                          {styles.label}
                        </span>
                        {region.lineNumber && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            שורה {region.lineNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {region.confidence && (
                          <span className="text-emerald-400 text-[10px] font-mono">
                            {region.confidence}%
                          </span>
                        )}
                        <button
                          onClick={(e) => handleCopyText(region.text, region.id, e)}
                          className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition opacity-0 group-hover:opacity-100"
                          title="העתק תוכן מיכל"
                        >
                          {copiedId === region.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-mono leading-relaxed truncate-2-lines ${
                        region.type === 'handwritten_code' || region.type === 'code'
                          ? 'text-emerald-200'
                          : 'text-slate-200'
                      }`}
                      dir={
                        region.type === 'handwritten_code' || region.type === 'code'
                          ? 'ltr'
                          : 'rtl'
                      }
                    >
                      {region.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>כל מיכל מקושר לריבוע המדויק בתמונה</span>
            </span>
            <span className="font-mono text-slate-400">{filteredRegions.length} מיכלים</span>
          </div>
        </div>
      </div>
    </div>
  );
};
