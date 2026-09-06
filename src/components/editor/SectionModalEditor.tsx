'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { NewsSection } from '@/types/project';

export interface SectionModalEditorProps {
  isOpen: boolean;
  section: NewsSection | null;
  onClose: () => void;
  onSave: (updatedSection: NewsSection) => void;
  onChange?: (liveSection: NewsSection) => void;
}

type ActiveTarget = 'heading' | 'subheading' | 'image' | 'body' | 'bullets' | 'border';

const COLOR_PRESETS = ['#111111', '#dc2626', '#991b1b', '#0369a1', '#1e3a8a', '#15803d', '#475569', '#d97706', '#ffffff'];

const AVAILABLE_FONTS = [
  { value: "'Baloo 2', sans-serif", label: "Baloo 2 ExtraBold (बालू 2)" },
  { value: "'Mukta', sans-serif", label: "Mukta ExtraBold (मुक्ता बोल्ड)" },
  { value: "'Noto Sans Devanagari', sans-serif", label: "Noto Sans Devanagari" },
  { value: "'Anek Devanagari', sans-serif", label: "Anek Devanagari SemiBold" },
  { value: "'Poppins', sans-serif", label: "Poppins (पॉपिन्स)" },
  { value: "'Tiro Devanagari Hindi', serif", label: "Tiro Devanagari Hindi" },
  { value: "'Noto Serif Devanagari', serif", label: "Noto Serif Devanagari" },
  { value: "'Rozha One', serif", label: "Rozha One (शाही देवानागरी)" },
  { value: "'Yatra One', cursive", label: "Yatra One (क्लासिक बोल्ड)" },
  { value: "'Martel', serif", label: "Martel Serif (अखबार मानक)" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'EB Garamond', serif", label: "EB Garamond" },
  { value: "'Inter', sans-serif", label: "Inter (Modern Sans)" },
];

export const SectionModalEditor: React.FC<SectionModalEditorProps> = ({
  isOpen,
  section,
  onClose,
  onSave,
  onChange,
}) => {
  const [localSection, setLocalSection] = useState<NewsSection | null>(null);
  const [activeTarget, setActiveTarget] = useState<ActiveTarget>('heading');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (section && isOpen) {
      setLocalSection({ ...section });
      setActiveTarget('heading');
    } else {
      setLocalSection(null);
      setActiveTarget('heading');
    }
  }, [section, isOpen]);

  if (!isOpen || !localSection) return null;

  const updateField = <K extends keyof NewsSection>(field: K, value: NewsSection[K]) => {
    const updated = { ...localSection, [field]: value };
    setLocalSection(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      updateField('image', objectUrl);
    }
  };

  const handlePasteContent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const newContent = localSection.content ? `${localSection.content}\n\n${text.trim()}` : text.trim();
        updateField('content', newContent);
      }
    } catch {
      // Fallback
    }
  };

  const handlePasteHeading = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateField('title', text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleSaveAndClose = () => {
    if (localSection) {
      onSave(localSection);
    }
    onClose();
  };

  const hasBg = localSection.bgColor && localSection.bgColor !== 'transparent';
  let borderStyleStr: React.CSSProperties = {};
  if (localSection.showCardBorder) {
    const bWidth = localSection.cardBorderWidth !== undefined ? Number(localSection.cardBorderWidth) : 1;
    const bColor = localSection.cardBorderColor || '#000000';
    borderStyleStr = {
      border: `${bWidth}px solid ${bColor}`,
      padding: '8px 10px',
      borderRadius: `${localSection.cardBorderRadius || 0}px`,
    };
  } else if (hasBg) {
    borderStyleStr = {
      backgroundColor: localSection.bgColor,
      padding: '6px 8px',
      borderRadius: '2px',
      border: '1px solid #cbd5e1',
    };
  }

  // Calculate preview slot width based on colSpan (exact broadsheet parity)
  const span = Math.min(12, Math.max(1, localSection.colSpan || 6));
  const previewSlotWidthPx = Math.round((span / 12) * 1284 - (span < 12 ? (18 * (12 - span) / 12) : 0));

  // Helper render paragraphs
  const paragraphs = (localSection.content || '')
    .split(/\n\s*\n|\n/)
    .map(p => p.trim())
    .filter(Boolean);

  const bulletsList = (localSection.bullets || '')
    .split('\n')
    .map(b => b.trim())
    .filter(Boolean);

  const isAd = localSection.layout === 'full-ad' || localSection.type === 'ad';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-[99vw] max-w-[1680px] h-[95vh] max-h-[96vh] flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= TOP HEADER ================= */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2 justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-red-600 flex items-center justify-center text-white text-sm shadow-md font-bold">
              📰
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>न्यूज़ सेक्शन एडिटर (Broadsheet Studio Editor)</span>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  {localSection.colSpan || 6} Col • {localSection.layout || 'standard'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                ओरिजिनल न्यूज़ लेआउट (बाएं) में किसी भी हिस्से पर क्लिक करें — उसका समर्पित एडिटर (दाएं) खुल जाएगा।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
            >
              ✕ बंद करें
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>✓</span>
              <span>सेव और डन (Done)</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN TWO-PANE SPLIT WORKSPACE ================= */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* LEFT PANE: AUTHENTIC BROADSHEET CANVAS SLOT PREVIEW (100% UNTOUCHED LAYOUT) */}
          <div className="flex-1 bg-[#090d16] p-4 sm:p-6 overflow-y-auto overflow-x-auto flex flex-col items-center justify-start custom-scrollbar border-b md:border-b-0 md:border-r border-slate-800/80">
            <div className="mb-3 text-[11px] text-slate-400 flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-sm shrink-0">
              <span className="text-amber-400">💡</span> 
              <span>अखबार में जैसा दिख रहा है, बिल्कुल वैसा ही यहाँ दिखेगा। किसी भी हिस्से पर क्लिक करके एडिट करें।</span>
            </div>

            {/* Authentic Paper Container */}
            <div
              className="newspaper-page-preview newspaper-page bg-[#fcfbfa] text-[#111111] shadow-[0_15px_45px_rgba(0,0,0,0.6)] rounded-[2px] transition-all relative select-text"
              style={{
                width: `${previewSlotWidthPx}px`,
                minWidth: `${previewSlotWidthPx}px`,
                maxWidth: `${previewSlotWidthPx}px`,
                minHeight: '180px',
                padding: '4px 6px 6px 6px',
                boxSizing: 'border-box',
                lineHeight: 1.38,
                ...borderStyleStr,
              }}
            >
              {isAd ? (
                // FULL AD SLOT PREVIEW
                <div
                  onClick={() => setActiveTarget('border')}
                  className={`relative full-ad-block cursor-pointer transition ${
                    activeTarget === 'border' ? 'ring-2 ring-cyan-500 rounded p-1' : ''
                  }`}
                >
                  {localSection.showAdTag !== false && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTarget('subheading');
                      }}
                      className={`text-center mb-0.5 cursor-pointer ${
                        activeTarget === 'subheading' ? 'ring-2 ring-amber-500 rounded' : 'hover:bg-amber-50'
                      }`}
                    >
                      <span className="inline-block text-[8px] uppercase tracking-widest text-slate-700 font-serif font-bold px-2 py-0.2 bg-slate-100 border border-slate-300 rounded-[2px] leading-tight shadow-xs">
                        {localSection.adTagText || 'विज्ञापन'}
                      </span>
                    </div>
                  )}

                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTarget('image');
                    }}
                    className={`w-full relative overflow-hidden bg-slate-100 border border-black shadow-xs cursor-pointer ${
                      activeTarget === 'image' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-400'
                    }`}
                    style={{ height: `${localSection.imageHeight || 220}px` }}
                  >
                    {localSection.image ? (
                      <img
                        src={localSection.image}
                        alt="Ad"
                        className="w-full h-full block"
                        style={{ objectFit: (localSection.imageFit as any) || 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 p-4 text-center bg-slate-50">
                        <span className="font-bold text-xs text-slate-700">विज्ञापन इमेज अपलोड करें</span>
                      </div>
                    )}
                  </div>

                  {localSection.title && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTarget('heading');
                      }}
                      className={`mt-1 text-center font-bold text-[11px] text-slate-900 cursor-pointer ${
                        activeTarget === 'heading' ? 'ring-2 ring-red-500 rounded' : 'hover:bg-red-50'
                      }`}
                      style={{ fontFamily: localSection.titleFont || "'Martel', serif" }}
                    >
                      {localSection.title}
                    </div>
                  )}
                </div>
              ) : (
                // STANDARD ARTICLE PREVIEW
                <div
                  className={`relative ${
                    localSection.showBorderLine ? 'border-b border-slate-400 pb-1' : ''
                  } ${activeTarget === 'border' ? 'ring-2 ring-cyan-500 rounded p-1' : ''}`}
                >
                  {/* TOPLINE / KICKER */}
                  {(localSection.topLine || localSection.tag) && (
                    <div
                      onClick={() => setActiveTarget('subheading')}
                      className={`cursor-pointer group relative p-0.5 -m-0.5 rounded transition ${
                        activeTarget === 'subheading' ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'hover:ring-1 hover:ring-amber-400'
                      }`}
                    >
                      <div
                        className="leading-snug pt-0.5 tracking-tight"
                        style={{
                          fontFamily: localSection.topLineFont || "'Mukta', sans-serif",
                          fontSize: localSection.topLineSize || '13px',
                          color: localSection.topLineColor || '#dc2626',
                          textAlign: (localSection.topLineAlign as any) || 'left',
                          fontWeight: localSection.topLineBold !== false ? '700' : '400',
                          fontStyle: localSection.topLineItalic ? 'italic' : 'normal',
                        }}
                      >
                        {localSection.tag && (
                          <span
                            className="inline-block px-1.5 py-0.5 uppercase tracking-wide align-middle mr-1.5 shadow-xs"
                            style={{
                              backgroundColor: localSection.tagBgColor || '#dc2626',
                              color: localSection.tagTextColor || '#ffffff',
                              fontSize: localSection.tagFontSize || '10px',
                              fontWeight: localSection.tagBold !== false ? '800' : '600',
                              borderRadius: '2px',
                            }}
                          >
                            {localSection.tag}
                          </span>
                        )}
                        {localSection.topLine && <span className="align-middle">{localSection.topLine}</span>}
                      </div>
                    </div>
                  )}

                  {/* MAIN HEADLINE */}
                  <div
                    onClick={() => setActiveTarget('heading')}
                    className={`cursor-pointer group relative p-0.5 -m-0.5 my-0.5 rounded transition ${
                      activeTarget === 'heading' ? 'ring-2 ring-red-500 bg-red-500/10' : 'hover:ring-1 hover:ring-red-400'
                    }`}
                  >
                    <h2
                      className="m-0 select-text"
                      style={{
                        fontFamily: localSection.titleFont || "'Rozha One', serif",
                        fontSize: localSection.fontSize || '22px',
                        color: localSection.titleColor || '#111111',
                        textAlign: (localSection.titleAlign as any) || 'left',
                        fontWeight: localSection.titleBold !== false ? '800' : 'normal',
                        fontStyle: localSection.titleItalic ? 'italic' : 'normal',
                        textDecoration: localSection.titleUnderline ? 'underline' : 'none',
                        lineHeight: 1.18,
                        letterSpacing: '-0.01em',
                        paddingBottom: '2px',
                      }}
                    >
                      {localSection.title || 'मुख्य समाचार शीर्षक यहाँ लिखें'}
                    </h2>
                  </div>

                  {/* SUBTITLE */}
                  {localSection.subtitle && (
                    <div
                      onClick={() => setActiveTarget('subheading')}
                      className={`cursor-pointer group relative p-0.5 -m-0.5 my-0.5 rounded transition ${
                        activeTarget === 'subheading' ? 'ring-2 ring-amber-500 bg-amber-500/10' : 'hover:ring-1 hover:ring-amber-400'
                      }`}
                    >
                      <h3
                        className="font-semibold italic my-0.5 leading-snug"
                        style={{
                          fontFamily: localSection.subtitleFont || "'Martel', serif",
                          fontSize: localSection.subtitleSize || '12.5px',
                          color: localSection.subtitleColor || '#334155',
                          textAlign: (localSection.subtitleAlign as any) || 'left',
                        }}
                      >
                        {localSection.subtitle}
                      </h3>
                    </div>
                  )}

                  {/* IMAGE (TOP OR STANDARD) */}
                  {localSection.image && localSection.layout !== 'bottom-img' && localSection.layout !== 'text-only' && (
                    <div
                      onClick={() => setActiveTarget('image')}
                      className={`my-1 cursor-pointer group relative transition rounded ${
                        activeTarget === 'image' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:ring-1 hover:ring-blue-400'
                      }`}
                    >
                      <img
                        src={localSection.image}
                        alt="Photo"
                        className="w-full object-cover border border-black p-0.5"
                        style={{ maxHeight: `${localSection.imageHeight || 200}px` }}
                      />
                      {localSection.caption && (
                        <div
                          className="text-[9.5px] italic text-slate-700 pt-0.5"
                          style={{ textAlign: (localSection.captionAlign as any) || 'left' }}
                        >
                          {localSection.caption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BULLET POINTS */}
                  {bulletsList.length > 0 && (
                    <div
                      onClick={() => setActiveTarget('bullets')}
                      className={`my-1 cursor-pointer group relative rounded transition p-0.5 ${
                        activeTarget === 'bullets' ? 'ring-2 ring-purple-500 bg-purple-500/10' : 'hover:ring-1 hover:ring-purple-400'
                      }`}
                    >
                      <div
                        className="p-1.5 rounded border border-slate-300"
                        style={{ backgroundColor: localSection.bulletBgColor || 'transparent' }}
                      >
                        {bulletsList.map((b, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[10.5px] leading-tight my-0.5">
                            <span style={{ color: localSection.bulletColor || '#dc2626' }}>■</span>
                            <span className="font-semibold text-slate-900">{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MAIN BODY PARAGRAPHS */}
                  <div
                    onClick={() => setActiveTarget('body')}
                    className={`cursor-pointer group relative rounded transition p-0.5 -m-0.5 ${
                      activeTarget === 'body' ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : 'hover:ring-1 hover:ring-emerald-400'
                    }`}
                  >
                    <div
                      className="font-martel leading-relaxed text-justify"
                      style={{
                        fontFamily: localSection.bodyFont || "'Martel', serif",
                        fontSize: localSection.bodySize || '11px',
                        columnCount: localSection.bodyCols || 1,
                        columnGap: '14px',
                        textAlign: (localSection.bodyAlign as any) || 'justify',
                        lineHeight: 1.38,
                      }}
                    >
                      {paragraphs.length > 0 ? (
                        paragraphs.map((p, pIdx) => (
                          <p key={pIdx} className="story-paragraph mb-1">
                            {pIdx === 0 && localSection.dropCap ? (
                              <>
                                <span className="float-left text-3xl font-bold font-serif leading-none pr-1.5 text-slate-900">
                                  {p.charAt(0)}
                                </span>
                                {p.slice(1)}
                              </>
                            ) : (
                              p
                            )}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-400 italic text-xs">[मुख्य समाचार का टेक्स्ट यहाँ दिखेगा...]</p>
                      )}
                    </div>
                  </div>

                  {/* IMAGE (BOTTOM LAYOUT) */}
                  {localSection.image && localSection.layout === 'bottom-img' && (
                    <div
                      onClick={() => setActiveTarget('image')}
                      className={`my-1 cursor-pointer group relative transition rounded ${
                        activeTarget === 'image' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:ring-1 hover:ring-blue-400'
                      }`}
                    >
                      <img
                        src={localSection.image}
                        alt="Photo"
                        className="w-full object-cover border border-black p-0.5"
                        style={{ maxHeight: `${localSection.imageHeight || 200}px` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: DEDICATED EXTERNAL EDITOR TOOLBARS (OUTSIDE THE NEWS SECTION) */}
          <div className="w-full md:w-[440px] lg:w-[480px] shrink-0 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">
            
            {/* Navigation Tabs Strip */}
            <div className="px-3.5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none custom-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTarget('heading')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'heading'
                    ? 'bg-red-600 text-white shadow-md ring-1 ring-red-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔤</span>
                <span>हेडिंग</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('subheading')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'subheading'
                    ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🏷️</span>
                <span>सबहेडिंग / किकर</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('body')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'body'
                    ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>📄</span>
                <span>मुख्य समाचार</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('image')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'image'
                    ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🖼️</span>
                <span>फोटो / लेआउट</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('bullets')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'bullets'
                    ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>📋</span>
                <span>बुलेट्स</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('border')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'border'
                    ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔲</span>
                <span>बॉर्डर व फ्रेम</span>
              </button>
            </div>

            {/* Active Dedicated Editor Panel */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              
              {/* 1. HEADING TOOLBAR */}
              {activeTarget === 'heading' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-heading text-red-400"></i> मुख्य शीर्षक एडिटर (Headline Typography)
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteHeading}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-red-300 hover:text-white rounded border border-red-900/60 text-[10.5px] font-semibold transition flex items-center gap-1"
                    >
                      <span>📋 हेडिंग पेस्ट करें</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">
                      मुख्य शीर्षक (Headline Text):
                    </label>
                    <textarea
                      value={localSection.title || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="मुख्य समाचार का शीर्षक लिखें..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition custom-scrollbar"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">फ़ॉन्ट स्टाइल:</label>
                      <select
                        value={localSection.titleFont || "'Rozha One', serif"}
                        onChange={(e) => updateField('titleFont', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-400 text-[10px] font-semibold">फ़ॉन्ट साइज़:</label>
                        <span className="text-red-400 font-mono font-bold text-[10px]">{localSection.fontSize || '22px'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="16"
                          max="72"
                          step="1"
                          value={parseInt(localSection.fontSize || '22', 10)}
                          onChange={(e) => updateField('fontSize', `${e.target.value}px`)}
                          className="flex-1 accent-red-500 h-1.5 rounded cursor-pointer"
                        />
                        <div className="flex gap-1">
                          {['20px', '24px', '28px', '36px'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateField('fontSize', s)}
                              className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                                localSection.fontSize === s ? 'bg-red-600 text-white font-bold' : 'bg-slate-950 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">हेडिंग रंग (Color):</label>
                      <div className="flex items-center gap-1.5">
                        {COLOR_PRESETS.slice(0, 6).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateField('titleColor', c)}
                            className={`w-5 h-5 rounded-full border ${localSection.titleColor === c ? 'border-white scale-110 shadow' : 'border-slate-700'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={localSection.titleColor || '#111111'}
                          onChange={(e) => updateField('titleColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        {['left', 'center', 'right', 'justify'].map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => updateField('titleAlign', a as any)}
                            className={`px-2 py-1 rounded text-[10.5px] font-bold ${
                              (localSection.titleAlign || 'left') === a ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {a === 'left' ? '⬅️' : a === 'center' ? '↔️' : a === 'right' ? '➡️' : '☰'}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateField('titleBold', localSection.titleBold === false)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                            localSection.titleBold !== false ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('titleItalic', !localSection.titleItalic)}
                          className={`px-2.5 py-1 rounded text-[11px] font-serif italic border ${
                            localSection.titleItalic ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('titleUnderline', !localSection.titleUnderline)}
                          className={`px-2.5 py-1 rounded text-[11px] underline border ${
                            localSection.titleUnderline ? 'bg-red-600 text-white border-red-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          U
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SUBHEADING & KICKER TOOLBAR */}
              {activeTarget === 'subheading' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-tag text-amber-400"></i> सबहेडिंग, किकर व श्रेणी टैग एडिटर
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">सुपर हेडलाइन / किकर टेक्स्ट:</label>
                      <input
                        type="text"
                        value={localSection.topLine || ''}
                        onChange={(e) => updateField('topLine', e.target.value)}
                        placeholder="e.g. मौसम विभाग की चेतावनी..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">श्रेणी टैग (Category Badge):</label>
                      <input
                        type="text"
                        value={localSection.tag || ''}
                        onChange={(e) => updateField('tag', e.target.value)}
                        placeholder="e.g. ब्रेकिंग न्यूज़, खास खबर..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">उप-शीर्षक (Subtitle / Sub-headline):</label>
                      <input
                        type="text"
                        value={localSection.subtitle || ''}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        placeholder="e.g. अधिसूचना जारी; कार्य शुरू होगा..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">किकर फ़ॉन्ट (Font Family):</label>
                      <select
                        value={localSection.topLineFont || "'Mukta', sans-serif"}
                        onChange={(e) => updateField('topLineFont', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-400 text-[10px] font-semibold">साइज़:</label>
                        <span className="text-amber-300 font-mono font-bold text-[10px]">{localSection.topLineSize || '13px'}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="24"
                        step="1"
                        value={parseInt(localSection.topLineSize || '13', 10)}
                        onChange={(e) => updateField('topLineSize', `${e.target.value}px`)}
                        className="w-full accent-amber-500 h-1.5 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">किकर रंग:</label>
                      <div className="flex items-center gap-1.5">
                        {['#dc2626', '#0369a1', '#15803d', '#111111', '#d97706'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateField('topLineColor', c)}
                            className={`w-5 h-5 rounded-full border ${localSection.topLineColor === c ? 'border-white scale-110 shadow' : 'border-slate-700'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={localSection.topLineColor || '#dc2626'}
                          onChange={(e) => updateField('topLineColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">टैग बैकग्राउंड:</label>
                        <input
                          type="color"
                          value={localSection.tagBgColor || '#dc2626'}
                          onChange={(e) => updateField('tagBgColor', e.target.value)}
                          className="w-full h-7 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">टैग टेक्स्ट रंग:</label>
                        <input
                          type="color"
                          value={localSection.tagTextColor || '#ffffff'}
                          onChange={(e) => updateField('tagTextColor', e.target.value)}
                          className="w-full h-7 rounded bg-slate-950 border border-slate-700 p-0.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. MAIN NEWS (BODY) TOOLBAR */}
              {activeTarget === 'body' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-newspaper text-emerald-400"></i> मुख्य समाचार एडिटर (Body Text & Columns)
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteContent}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                    >
                      <span>📋 क्लिपबोर्ड से पेस्ट करें</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-300 text-[10.5px] font-semibold">मुख्य समाचार का टेक्स्ट:</label>
                      <span className="text-[9.5px] text-slate-400 font-mono">Enter = नया पैराग्राफ</span>
                    </div>
                    <textarea
                      value={localSection.content || ''}
                      onChange={(e) => updateField('content', e.target.value)}
                      placeholder="यहाँ मुख्य समाचार लिखें या पेस्ट करें..."
                      className="w-full h-48 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-sans text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed custom-scrollbar"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">बॉडी फ़ॉन्ट:</label>
                      <select
                        value={localSection.bodyFont || "'Martel', serif"}
                        onChange={(e) => updateField('bodyFont', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none"
                      >
                        {AVAILABLE_FONTS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-400 text-[10px] font-semibold">फ़ॉन्ट साइज़:</label>
                        <span className="text-emerald-400 font-mono font-bold text-[10px]">{localSection.bodySize || '11px'}</span>
                      </div>
                      <input
                        type="range"
                        min="9"
                        max="20"
                        step="0.5"
                        value={parseFloat(localSection.bodySize || '11')}
                        onChange={(e) => updateField('bodySize', `${e.target.value}px`)}
                        className="w-full accent-emerald-500 h-1.5 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">कॉलम विभाजन (Columns):</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateField('bodyCols', c as any)}
                            className={`py-1.5 rounded text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                              (localSection.bodyCols || 1) === c
                                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {c} Col
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        {['justify', 'left', 'center', 'right'].map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => updateField('bodyAlign', a as any)}
                            className={`px-2.5 py-1 rounded text-[10.5px] font-bold ${
                              (localSection.bodyAlign || 'justify') === a ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {a === 'justify' ? '☰ Justify' : a === 'left' ? '⬅️' : a === 'center' ? '↔️' : '➡️'}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateField('dropCap', !localSection.dropCap)}
                        className={`px-3 py-1 rounded text-[10.5px] font-bold border ${
                          localSection.dropCap ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Drop Cap: {localSection.dropCap ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PHOTO & CAPTION TOOLBAR */}
              {activeTarget === 'image' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-image text-blue-400"></i> फ़ोटो, लेआउट व कैप्शन सेटिंग्स
                    </span>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>📁 फ़ोटो अपलोड</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1 font-semibold">फोटो लेआउट पोजीशन:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'top-img', label: 'Top Image' },
                        { id: 'left-img', label: 'Left Float' },
                        { id: 'right-img', label: 'Right Float' },
                        { id: 'hero-split', label: 'Hero Feature' },
                        { id: 'bottom-img', label: 'Bottom Image' },
                        { id: 'text-only', label: 'Text Only' },
                      ].map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => updateField('layout', l.id as any)}
                          className={`py-1.5 px-2 rounded text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition ${
                            (localSection.layout === l.id || (!localSection.layout && l.id === 'top-img'))
                              ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">फोटो वेब लिंक (URL):</label>
                      <input
                        type="text"
                        value={localSection.image || ''}
                        onChange={(e) => updateField('image', e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">फोटो कैप्शन:</label>
                      <input
                        type="text"
                        value={localSection.caption || ''}
                        onChange={(e) => updateField('caption', e.target.value)}
                        placeholder="फोटो: घटना का विवरण व साभार..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-400 text-[10px] font-semibold">फोटो ऊंचाई (Height):</label>
                        <span className="text-blue-400 font-mono font-bold text-[10px]">{localSection.imageHeight || 240}px</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="450"
                        step="10"
                        value={localSection.imageHeight || 240}
                        onChange={(e) => updateField('imageHeight', parseInt(e.target.value, 10))}
                        className="w-full accent-blue-500 h-1.5 rounded cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">इमेज फ़िट मोड:</label>
                        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => updateField('imageFit', 'cover')}
                            className={`py-1 rounded text-[10px] font-bold ${
                              (localSection.imageFit || 'cover') === 'cover' ? 'bg-blue-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            COVER
                          </button>
                          <button
                            type="button"
                            onClick={() => updateField('imageFit', 'contain')}
                            className={`py-1 rounded text-[10px] font-bold ${
                              localSection.imageFit === 'contain' ? 'bg-blue-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            CONTAIN
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1 font-semibold">कैप्शन अलाइनमेंट:</label>
                        <div className="grid grid-cols-3 gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                          {['left', 'center', 'right'].map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => updateField('captionAlign', a as any)}
                              className={`py-1 rounded text-[10px] font-bold ${
                                (localSection.captionAlign || 'left') === a ? 'bg-blue-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BULLETS TOOLBAR */}
              {activeTarget === 'bullets' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-list text-purple-400"></i> मुख्य बिंदु एडिटर (Bullet Points)
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">
                      मुख्य बिंदु (1 लाइन = 1 बुलेट बिंदु):
                    </label>
                    <textarea
                      value={localSection.bullets || ''}
                      onChange={(e) => updateField('bullets', e.target.value)}
                      placeholder="पहला मुख्य बिंदु यहाँ लिखें...\nदूसरा मुख्य बिंदु यहाँ लिखें..."
                      className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-medium text-xs focus:border-purple-500 outline-none leading-relaxed custom-scrollbar"
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">बुलेट मार्कर रंग:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={localSection.bulletColor || '#dc2626'}
                          onChange={(e) => updateField('bulletColor', e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        {['#dc2626', '#0369a1', '#15803d', '#111111'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateField('bulletColor', c)}
                            className="w-5 h-5 rounded-full border border-slate-600"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">बुलेट बॉक्स बैकग्राउंड:</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateField('bulletBgColor', '#f0fdf4')}
                          className="px-2.5 py-1 rounded text-[10.5px] bg-emerald-950 text-emerald-300 border border-emerald-800"
                        >
                          Light Green
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('bulletBgColor', '#fef2f2')}
                          className="px-2.5 py-1 rounded text-[10.5px] bg-red-950 text-red-300 border border-red-800"
                        >
                          Light Red
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('bulletBgColor', 'transparent')}
                          className="px-2.5 py-1 rounded text-[10.5px] bg-slate-950 text-slate-400 border border-slate-800"
                        >
                          Plain
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. BORDER & BACKGROUND TOOLBAR */}
              {activeTarget === 'border' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-border-all text-cyan-400"></i> सेक्शन फ्रेम, बॉर्डर व बैकग्राउंड सेटिंग्स
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-slate-300 text-[11px] font-semibold block">बैकग्राउंड रंग:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localSection.bgColor && localSection.bgColor !== 'transparent' ? localSection.bgColor : '#ffffff'}
                        onChange={(e) => updateField('bgColor', e.target.value)}
                        className="w-8 h-8 bg-slate-950 border border-slate-700 rounded cursor-pointer p-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => updateField('bgColor', 'transparent')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                      >
                        Transparent
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(localSection.showCardBorder)}
                          onChange={(e) => updateField('showCardBorder', e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500 cursor-pointer"
                        />
                        <span>सेक्शन में बॉर्डर जोड़ें</span>
                      </label>
                      <span className="text-[10px] font-mono font-bold text-emerald-400">
                        {localSection.showCardBorder ? 'ENABLED' : 'OFF'}
                      </span>
                    </div>

                    {localSection.showCardBorder && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 text-[10px] block mb-1 font-semibold">बॉर्डर रंग:</label>
                          <input
                            type="color"
                            value={localSection.cardBorderColor || '#000000'}
                            onChange={(e) => updateField('cardBorderColor', e.target.value)}
                            className="w-7 h-7 bg-slate-900 border border-slate-700 rounded cursor-pointer p-0.5"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-slate-400 text-[10px] font-semibold">मोटाई (Width):</label>
                            <span className="text-cyan-400 font-mono font-bold text-[10px]">
                              {localSection.cardBorderWidth || 1}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="6"
                            step="0.5"
                            value={localSection.cardBorderWidth || 1}
                            onChange={(e) => updateField('cardBorderWidth', parseFloat(e.target.value))}
                            className="w-full accent-cyan-500 h-1.5 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SectionModalEditor;
