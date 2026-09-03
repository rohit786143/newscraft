'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OverlayWidgetConfig {
  id: string;
  name: string;
  visible: boolean;
  xPercent: number; // 0% to 100%
  yPercent: number; // 0% to 100%
  fontSize: number; // in pt/px
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '600' | '800';
  isItalic: boolean;
  content?: string; // Custom content if applicable
}

export interface HeaderOverlayState {
  bannerImage: string | null;
  bannerHeight: number; // in px
  isEditMode: boolean; // Toggle drag handles & selection rings
  widgets: {
    date: OverlayWidgetConfig;
    weather: OverlayWidgetConfig;
    metadata: OverlayWidgetConfig;
  };
}

export interface HeaderCanvasOverlayProps {
  initialState?: Partial<HeaderOverlayState>;
  onChange?: (state: HeaderOverlayState) => void;
  isExporting?: boolean; // When true, completely hide all edit UI
}

// ============================================================================
// HINDI DATE & WEATHER GENERATORS
// ============================================================================

const HINDI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const HINDI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

export function getAutoHindiDateString(date: Date = new Date()): string {
  const dayName = HINDI_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = HINDI_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

// Default initial state
const DEFAULT_HEADER_STATE: HeaderOverlayState = {
  bannerImage: null,
  bannerHeight: 150,
  isEditMode: true,
  widgets: {
    date: {
      id: 'date',
      name: 'तारीख व दिन (Date & Day)',
      visible: true,
      xPercent: 82, // Top Right corner
      yPercent: 12,
      fontSize: 10,
      fontColor: '#ffffff',
      fontFamily: "'Mukta', sans-serif",
      fontWeight: '600',
      isItalic: false
    },
    weather: {
      id: 'weather',
      name: 'मौसम पूर्वानुमान (Weather Forecast)',
      visible: true,
      xPercent: 4, // Top Left corner
      yPercent: 12,
      fontSize: 9.5,
      fontColor: '#ffffff',
      fontFamily: "'Mukta', sans-serif",
      fontWeight: '600',
      isItalic: false
    },
    metadata: {
      id: 'metadata',
      name: 'पत्रिका विवरण व मूल्य (Edition & Price)',
      visible: true,
      xPercent: 4, // Bottom strip
      yPercent: 82,
      fontSize: 10,
      fontColor: '#111827',
      fontFamily: "'Martel', serif",
      fontWeight: 'bold',
      isItalic: false,
      content: 'वर्ष 24 | अंक 182 | पंजीकृत नंबर: HPHIN/2009/42467 | मूल्य: ₹ 5.00'
    }
  }
};

// ============================================================================
// MAIN COMPONENT: HeaderCanvasOverlay
// ============================================================================

export const HeaderCanvasOverlay: React.FC<HeaderCanvasOverlayProps> = ({
  initialState,
  onChange,
  isExporting = false
}) => {
  const [state, setState] = useState<HeaderOverlayState>({
    ...DEFAULT_HEADER_STATE,
    ...initialState
  });

  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragTargetRef = useRef<string | null>(null);

  // Auto Hindi Date String
  const [currentHindiDate, setCurrentHindiDate] = useState(getAutoHindiDateString());

  useEffect(() => {
    setCurrentHindiDate(getAutoHindiDateString());
  }, []);

  // Propagate state changes to parent editor
  useEffect(() => {
    if (onChange) {
      onChange(state);
    }
  }, [state, onChange]);

  // ==========================================================================
  // IMAGE UPLOAD HANDLER (BASE64 CONVERTER)
  // ==========================================================================
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result as string;
      setState((prev) => ({
        ...prev,
        bannerImage: base64Data
      }));
    };
    reader.readAsDataURL(file);
  };

  // ==========================================================================
  // DRAG & DROP PERCENTAGE POSITIONING ENGINE
  // ==========================================================================
  const startDragging = (widgetId: string, e: React.MouseEvent) => {
    if (!state.isEditMode || isExporting) return;
    e.stopPropagation();
    e.preventDefault();

    setActiveWidgetId(widgetId);
    isDraggingRef.current = true;
    dragTargetRef.current = widgetId;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !dragTargetRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const widgetKey = dragTargetRef.current as keyof HeaderOverlayState['widgets'];

    // Calculate clamped percentages within container boundary
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const xPercent = Math.max(0, Math.min(95, Math.round((rawX / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(92, Math.round((rawY / rect.height) * 100)));

    setState((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetKey]: {
          ...prev.widgets[widgetKey],
          xPercent,
          yPercent
        }
      }
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    dragTargetRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ==========================================================================
  // WIDGET UPDATE HELPERS
  // ==========================================================================
  const updateWidgetConfig = (
    widgetKey: keyof HeaderOverlayState['widgets'],
    key: keyof OverlayWidgetConfig,
    value: any
  ) => {
    setState((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widgetKey]: {
          ...prev.widgets[widgetKey],
          [key]: value
        }
      }
    }));
  };

  const resetWidgetPositions = () => {
    setState((prev) => ({
      ...prev,
      widgets: {
        ...DEFAULT_HEADER_STATE.widgets
      }
    }));
  };

  return (
    <div className="w-full flex flex-col gap-3 font-sans">
      
      {/* ================= EDIT CONTROLS TOOLBAR (HIDDEN IN EXPORT/PRINT) ================= */}
      {!isExporting && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-md">
          
          {/* 1. Upload Banner Button */}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 shadow transition">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>कस्टम हेडर इमेज अपलोड करें</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </label>

            {state.bannerImage && (
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, bannerImage: null }))}
                className="bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 px-2.5 py-1.5 rounded flex items-center gap-1 transition"
              >
                <i className="fa-solid fa-trash"></i> बैनर हटाएं
              </button>
            )}
          </div>

          {/* 2. Height Slider & Position Reset */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">ऊंचाई (Height):</span>
              <input
                type="range"
                min="100"
                max="260"
                step="5"
                value={state.bannerHeight}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, bannerHeight: parseInt(e.target.value, 10) }))
                }
                className="w-24 accent-blue-500 cursor-pointer"
              />
              <span className="font-mono text-amber-300 font-bold">{state.bannerHeight}px</span>
            </div>

            <button
              type="button"
              onClick={resetWidgetPositions}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded flex items-center gap-1 transition"
              title="डिफ़ॉल्ट स्थानों पर रीसेट करें"
            >
              <i className="fa-solid fa-arrows-rotate"></i> रीसेट
            </button>

            {/* Edit Mode Toggle */}
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, isEditMode: !prev.isEditMode }))}
              className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition ${
                state.isEditMode
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <i className="fa-solid fa-hand"></i>
              <span>{state.isEditMode ? 'ड्रैग मोड: चालू' : 'प्रीव्यू मोड'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= ACTIVE WIDGET STYLE TOOLBAR (WHEN CLICKED) ================= */}
      {!isExporting && state.isEditMode && activeWidgetId && (
        <div className="bg-slate-950 border border-sky-800/80 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <i className="fa-solid fa-sliders"></i>
              {state.widgets[activeWidgetId as keyof HeaderOverlayState['widgets']]?.name}:
            </span>
            <label className="flex items-center gap-1 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={state.widgets[activeWidgetId as keyof HeaderOverlayState['widgets']]?.visible}
                onChange={(e) =>
                  updateWidgetConfig(
                    activeWidgetId as keyof HeaderOverlayState['widgets'],
                    'visible',
                    e.target.checked
                  )
                }
                className="accent-sky-500 rounded"
              />
              <span>दिखाएं (Visible)</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            {/* Font Size */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">साइज़:</span>
              <input
                type="number"
                min="8"
                max="24"
                step="0.5"
                value={
                  state.widgets[activeWidgetId as keyof HeaderOverlayState['widgets']]?.fontSize || 10
                }
                onChange={(e) =>
                  updateWidgetConfig(
                    activeWidgetId as keyof HeaderOverlayState['widgets'],
                    'fontSize',
                    parseFloat(e.target.value) || 10
                  )
                }
                className="w-14 bg-slate-900 border border-slate-700 text-amber-300 font-mono text-center rounded px-1 py-0.5"
              />
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400">रंग:</span>
              <input
                type="color"
                value={
                  state.widgets[activeWidgetId as keyof HeaderOverlayState['widgets']]?.fontColor || '#ffffff'
                }
                onChange={(e) =>
                  updateWidgetConfig(
                    activeWidgetId as keyof HeaderOverlayState['widgets'],
                    'fontColor',
                    e.target.value
                  )
                }
                className="w-6 h-6 bg-slate-900 border border-slate-700 rounded cursor-pointer p-0.5"
              />
            </div>

            {/* Close Active Editor */}
            <button
              type="button"
              onClick={() => setActiveWidgetId(null)}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      {/* ================= THE MAIN HEADER CANVAS OVERLAY CONTAINER ================= */}
      <div
        ref={containerRef}
        style={{
          height: `${state.bannerHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#fcfbfa',
          userSelect: 'none'
        }}
        className="w-full border-b-2 border-black select-none"
      >
        {/* Layer 1: Background Banner Image (Custom Upload or Default Newspaper Header) */}
        {state.bannerImage ? (
          <img
            src={state.bannerImage}
            alt="Custom Newspaper Header Banner"
            className="w-full h-full object-cover absolute top-0 left-0 pointer-events-none"
            style={{ zIndex: 1 }}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-stone-50 to-amber-50/40 p-4 border border-dashed border-stone-300"
            style={{ zIndex: 1 }}
          >
            <h1
              className="text-4xl font-extrabold text-red-700 tracking-tight"
              style={{ fontFamily: "'Rozha One', serif" }}
            >
              दैनिक हिमाचल एक्सप्रेस
            </h1>
            <p className="text-[11px] text-stone-600 mt-1" style={{ fontFamily: "'Martel', serif" }}>
              प्रदेश का सर्वाधिक विश्वसनीय और लोकप्रिय समाचार पत्र
            </p>
          </div>
        )}

        {/* ================= LAYER 2: DYNAMIC AUTO-UPDATE OVERLAY PLACEHOLDERS (z-index: 2) ================= */}

        {/* 1. Date & Day Widget */}
        {state.widgets.date.visible && (
          <div
            onMouseDown={(e) => startDragging('date', e)}
            style={{
              position: 'absolute',
              top: `${state.widgets.date.yPercent}%`,
              left: `${state.widgets.date.xPercent}%`,
              fontSize: `${state.widgets.date.fontSize}pt`,
              color: state.widgets.date.fontColor,
              fontFamily: state.widgets.date.fontFamily,
              fontWeight: state.widgets.date.fontWeight,
              fontStyle: state.widgets.date.isItalic ? 'italic' : 'normal',
              zIndex: 10,
              cursor: state.isEditMode && !isExporting ? 'move' : 'default',
              textShadow: state.bannerImage ? '0 1px 3px rgba(0,0,0,0.8)' : 'none'
            }}
            className={`transition-shadow flex items-center gap-1.5 ${
              state.isEditMode && !isExporting && activeWidgetId === 'date'
                ? 'ring-2 ring-sky-500 bg-black/40 px-1.5 py-0.5 rounded shadow-lg'
                : state.isEditMode && !isExporting
                ? 'hover:ring-1 hover:ring-sky-400/80 px-1 py-0.5'
                : ''
            }`}
          >
            <i className="fa-regular fa-calendar-days text-[0.85em] opacity-80"></i>
            <span>{currentHindiDate}</span>
          </div>
        )}

        {/* 2. Weather Forecast Widget */}
        {state.widgets.weather.visible && (
          <div
            onMouseDown={(e) => startDragging('weather', e)}
            style={{
              position: 'absolute',
              top: `${state.widgets.weather.yPercent}%`,
              left: `${state.widgets.weather.xPercent}%`,
              fontSize: `${state.widgets.weather.fontSize}pt`,
              color: state.widgets.weather.fontColor,
              fontFamily: state.widgets.weather.fontFamily,
              fontWeight: state.widgets.weather.fontWeight,
              zIndex: 10,
              cursor: state.isEditMode && !isExporting ? 'move' : 'default',
              textShadow: state.bannerImage ? '0 1px 3px rgba(0,0,0,0.8)' : 'none'
            }}
            className={`transition-shadow flex items-center gap-2 ${
              state.isEditMode && !isExporting && activeWidgetId === 'weather'
                ? 'ring-2 ring-sky-500 bg-black/40 px-1.5 py-0.5 rounded shadow-lg'
                : state.isEditMode && !isExporting
                ? 'hover:ring-1 hover:ring-sky-400/80 px-1 py-0.5'
                : ''
            }`}
          >
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-cloud-sun text-amber-400 text-[0.9em]"></i>
              <span>शिमला 20°/14°</span>
            </div>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-sun text-amber-400 text-[0.9em]"></i>
              <span>धर्मशाला 23°/20°</span>
            </div>
            <span className="opacity-40">•</span>
            <div className="flex items-center gap-1">
              <i className="fa-solid fa-cloud-rain text-blue-400 text-[0.9em]"></i>
              <span>मंडी 29°/22°</span>
            </div>
          </div>
        )}

        {/* 3. Metadata & Price Widget */}
        {state.widgets.metadata.visible && (
          <div
            onMouseDown={(e) => startDragging('metadata', e)}
            style={{
              position: 'absolute',
              top: `${state.widgets.metadata.yPercent}%`,
              left: `${state.widgets.metadata.xPercent}%`,
              fontSize: `${state.widgets.metadata.fontSize}pt`,
              color: state.widgets.metadata.fontColor,
              fontFamily: state.widgets.metadata.fontFamily,
              fontWeight: state.widgets.metadata.fontWeight,
              zIndex: 10,
              cursor: state.isEditMode && !isExporting ? 'move' : 'default',
              textShadow: state.bannerImage ? '0 1px 3px rgba(0,0,0,0.8)' : 'none'
            }}
            className={`transition-shadow flex items-center gap-1 ${
              state.isEditMode && !isExporting && activeWidgetId === 'metadata'
                ? 'ring-2 ring-sky-500 bg-black/40 px-1.5 py-0.5 rounded shadow-lg'
                : state.isEditMode && !isExporting
                ? 'hover:ring-1 hover:ring-sky-400/80 px-1 py-0.5'
                : ''
            }`}
          >
            <span>{state.widgets.metadata.content || DEFAULT_HEADER_STATE.widgets.metadata.content}</span>
          </div>
        )}

      </div>

    </div>
  );
};

export default HeaderCanvasOverlay;
