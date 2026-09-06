'use client';

import React, { useState, useRef, useEffect } from 'react';

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

export const SectionModalEditor = ({
  isOpen,
  section,
  onClose,
  onSave,
  onChange,
}) => {
  const [localSection, setLocalSection] = useState(null);
  const [activeTarget, setActiveTarget] = useState('heading');
  const [zoomScale, setZoomScale] = useState(1.0);
  const fileInputRef = useRef(null);
  const previewContainerRef = useRef(null);
  const paperWrapRef = useRef(null);

  useEffect(() => {
    if (section && isOpen) {
      setLocalSection({ ...section });
      setActiveTarget('heading');
      const timer = setTimeout(() => {
        handleZoomFit();
      }, 60);
      return () => clearTimeout(timer);
    } else {
      setLocalSection(null);
      setActiveTarget('heading');
      setZoomScale(1.0);
    }
  }, [section, isOpen]);

  if (!isOpen || !localSection) return null;

  const updateField = (field, value) => {
    const updated = { ...localSection, [field]: value };
    setLocalSection(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(2.5, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.25, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleZoomReset = () => {
    setZoomScale(1.0);
  };

  const handleZoomFit = () => {
    if (!previewContainerRef.current) return;
    const containerW = previewContainerRef.current.clientWidth || 700;
    const availableW = Math.max(260, containerW - 48);
    const slotW = previewSlotWidthPx || 850;
    const targetScale = Math.min(1.0, Math.max(0.3, availableW / slotW));
    setZoomScale(Math.round(targetScale * 100) / 100);
  };

  const handleImageFileChange = (e) => {
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
  let borderStyleStr = {};
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
  let previewSlotWidthPx = 850;
  if (typeof window !== 'undefined' && localSection.id) {
    const canvasEl = document.getElementById('wrapper-' + localSection.id);
    if (canvasEl) {
      const parsed = parseFloat(window.getComputedStyle(canvasEl).width);
      if (parsed && !isNaN(parsed) && parsed > 50) {
        previewSlotWidthPx = Math.round(parsed);
      }
    }
  }
  if (previewSlotWidthPx === 850) {
    const innerGridWidth = 1283.52; // standard broadsheet grid
    const gapDec = span < 12 ? (18 * (12 - span) / 12) : 0;
    previewSlotWidthPx = Math.round((span / 12) * innerGridWidth - gapDec);
  }

  // Parse decimal helper
  const parseDecimalSize = (val, defaultVal = 14) => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const parsed = parseFloat(String(val).replace(/px|pt|rem|em/gi, ''));
    return isNaN(parsed) ? defaultVal : parsed;
  };

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
          <div 
            ref={previewContainerRef}
            className="flex-1 bg-[#090d16] p-4 sm:p-6 overflow-y-auto overflow-x-auto flex flex-col items-center justify-start custom-scrollbar border-b md:border-b-0 md:border-r border-slate-800/80"
          >
            {/* Top Toolbar Strip with Zoom & Helper */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
              <div className="text-[11px] text-slate-400 flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 shadow-sm">
                <span className="text-amber-400">💡</span> 
                <span>अखबार में जैसा दिख रहा है, बिल्कुल वैसा ही यहाँ दिखेगा। किसी भी हिस्से पर क्लिक करके एडिट करें।</span>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-900/95 border border-slate-700/80 rounded-lg p-1 shadow-sm">
                <span className="text-[10px] text-slate-400 font-semibold px-1.5">🔍 ज़ूम:</span>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition cursor-pointer"
                >
                  −
                </button>
                <span className="text-[10.5px] font-mono font-bold text-cyan-300 min-w-[42px] text-center px-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center border border-slate-700 transition cursor-pointer"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={handleZoomFit}
                  title="Fit to Screen"
                  className="px-2 py-0.5 rounded bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 text-[10px] font-semibold transition cursor-pointer"
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={handleZoomReset}
                  title="Reset to 100%"
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-semibold transition cursor-pointer"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Scalable Outer Wrapper */}
            <div 
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {/* Authentic Paper Container - Guaranteed White Paper with Overflow Proofing */}
              <div
                ref={paperWrapRef}
                className="newspaper-modal-slot-view shadow-[0_15px_45px_rgba(0,0,0,0.6)] rounded-[2px] transition-all relative select-text"
                style={{
                  width: `${previewSlotWidthPx}px`,
                  minWidth: `${previewSlotWidthPx}px`,
                  maxWidth: `${previewSlotWidthPx}px`,
                  minHeight: '180px',
                  padding: '8px 10px',
                  margin: '0px auto',
                  boxSizing: 'border-box',
                  lineHeight: 1.38,
                  backgroundColor: '#fcfbfa',
                  color: '#111111',
                  display: 'block',
                  overflow: 'visible',
                  ...borderStyleStr,
                }}
              >
                {isAd ? (
                  // FULL AD SLOT PREVIEW
                  <div
                    onClick={() => setActiveTarget('border')}
                    className={`relative full-ad-block cursor-pointer transition ${
                      activeTarget === 'border' ? 'outline outline-2 outline-cyan-500 rounded' : ''
                    }`}
                  >
                    {localSection.showAdTag !== false && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTarget('kicker');
                        }}
                        className={`text-center mb-0.5 cursor-pointer ${
                          activeTarget === 'kicker' ? 'outline outline-2 outline-amber-500 rounded' : 'hover:outline hover:outline-1 hover:outline-amber-400'
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
                        activeTarget === 'image' ? 'outline outline-2 outline-blue-500' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                      }`}
                      style={{ height: `${localSection.imageHeight || 220}px` }}
                    >
                      {localSection.image ? (
                        <img
                          src={localSection.image}
                          alt="Ad"
                          className="w-full h-full block"
                          style={{ objectFit: localSection.imageFit || 'cover', objectPosition: 'center' }}
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
                          activeTarget === 'heading' ? 'outline outline-2 outline-red-500 rounded' : 'hover:outline hover:outline-1 hover:outline-red-400'
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
                    className={`relative bg-[#fcfbfa] text-[#111111] ${
                      localSection.showBorderLine ? 'border-b border-slate-400 pb-1' : ''
                    } ${activeTarget === 'border' ? 'outline outline-2 outline-cyan-500 rounded' : ''}`}
                    style={{ backgroundColor: '#fcfbfa', color: '#111111' }}
                  >
                    {/* TOPLINE / KICKER */}
                    {(localSection.topLine || localSection.tag) && (
                      <div
                        onClick={() => setActiveTarget('kicker')}
                        className={`cursor-pointer rounded transition ${
                          activeTarget === 'kicker' ? 'outline outline-2 outline-amber-500 bg-amber-500/10' : 'hover:outline hover:outline-1 hover:outline-amber-400'
                        }`}
                      >
                        <div
                          className="leading-snug pt-0.5 tracking-tight"
                          style={{
                            fontFamily: localSection.topLineFont || "'Mukta', sans-serif",
                            fontSize: localSection.topLineSize || '13px',
                            color: localSection.topLineColor || '#dc2626',
                            textAlign: localSection.topLineAlign || 'left',
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
                      className={`cursor-pointer my-0.5 rounded transition ${
                        activeTarget === 'heading' ? 'outline outline-2 outline-red-500 bg-red-500/10' : 'hover:outline hover:outline-1 hover:outline-red-400'
                      }`}
                    >
                      <h2
                        className="m-0 select-text"
                        style={{
                          fontFamily: localSection.titleFont || "'Rozha One', serif",
                          fontSize: localSection.fontSize || '22px',
                          color: localSection.titleColor || '#111111',
                          textAlign: localSection.titleAlign || 'left',
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
                        className={`cursor-pointer my-0.5 rounded transition ${
                          activeTarget === 'subheading' ? 'outline outline-2 outline-amber-500 bg-amber-500/10' : 'hover:outline hover:outline-1 hover:outline-amber-400'
                        }`}
                      >
                        <h3
                          className="font-semibold italic my-0.5 leading-snug"
                          style={{
                            fontFamily: localSection.subtitleFont || "'Martel', serif",
                            fontSize: localSection.subtitleSize || '12.5px',
                            color: localSection.subtitleColor || '#334155',
                            textAlign: localSection.subtitleAlign || 'left',
                          }}
                        >
                          {localSection.subtitle}
                        </h3>
                      </div>
                    )}

                    {/* LAYOUT VARIANTS */}
                    {localSection.cutoutWrap ? (
                      <div
                        onClick={() => setActiveTarget('body')}
                        className={`font-martel leading-relaxed my-1 clearfix cursor-pointer ${
                          (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                        } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                        style={{
                          fontFamily: localSection.bodyFont || "'Martel', serif",
                          fontSize: localSection.bodySize || '11px',
                          textAlign: localSection.bodyAlign || 'justify',
                          lineHeight: 1.38,
                          backgroundColor: '#fcfbfa',
                          color: '#111111',
                        }}
                      >
                        {localSection.image && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('image');
                            }}
                            className={`cursor-pointer ${localSection.cutoutFloat === 'right' ? 'float-right' : 'float-left'} relative ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500' : ''
                            }`}
                          >
                            <img
                              src={localSection.image}
                              alt="Photo"
                              className="cutout-shape-img rounded-xs"
                              style={{
                                float: localSection.cutoutFloat === 'right' ? 'right' : 'left',
                                shapeOutside: `url('${localSection.image}')`,
                                shapeMargin: `${localSection.cutoutMargin !== undefined ? localSection.cutoutMargin : 2}px`,
                                width: `${localSection.cutoutWidth || 240}px`,
                                maxWidth: '95%',
                                marginTop: `${localSection.cutoutOffsetY || 0}px`,
                                [localSection.cutoutFloat === 'right' ? 'marginRight' : 'marginLeft']: `${localSection.cutoutOffsetX || 0}px`,
                                marginBottom: '2px',
                                objectFit: 'contain',
                                display: 'block',
                              }}
                            />
                          </div>
                        )}
                        {bulletsList.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('bullets');
                            }}
                            className="p-1.5 mb-1 rounded border border-slate-300"
                            style={{ backgroundColor: localSection.bulletBgColor || 'transparent' }}
                          >
                            {bulletsList.map((b, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10.5px] leading-tight my-0.5">
                                <span style={{ color: localSection.bulletColor || '#dc2626' }}>■</span>
                                <span className="font-semibold text-slate-900">{b}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {paragraphs.length > 0 ? (
                          paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                        {localSection.caption && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('image');
                            }}
                            className="clear-both pt-1 cursor-pointer text-[9.5px] italic text-slate-700"
                          >
                            {localSection.caption}
                          </div>
                        )}
                      </div>
                    ) : localSection.layout === 'left-img' ? (
                      <div
                        onClick={() => setActiveTarget('body')}
                        className={`font-martel leading-relaxed clearfix my-1 cursor-pointer rounded transition ${
                          (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                        } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                        style={{
                          fontFamily: localSection.bodyFont || "'Martel', serif",
                          fontSize: localSection.bodySize || '11px',
                          textAlign: localSection.bodyAlign || 'justify',
                          lineHeight: 1.38,
                          backgroundColor: '#fcfbfa',
                          color: '#111111',
                        }}
                      >
                        {localSection.image ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('image');
                            }}
                            className={`float-left w-[44%] max-w-[220px] mr-2 mb-1 border border-black p-0.5 bg-white cursor-pointer transition rounded ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                            }`}
                            title="क्लिक करके फोटो व लेआउट एडिट करें"
                          >
                            <img
                              src={localSection.image}
                              alt="Photo"
                              className="w-full max-h-44 object-cover"
                            />
                            {localSection.caption && (
                              <div className="text-[9.5px] italic text-slate-700 pt-0.5 text-center">
                                {localSection.caption}
                              </div>
                            )}
                          </div>
                        ) : null}
                        {bulletsList.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('bullets');
                            }}
                            className="p-1.5 mb-1 rounded border border-slate-300"
                            style={{ backgroundColor: localSection.bulletBgColor || 'transparent' }}
                          >
                            {bulletsList.map((b, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10.5px] leading-tight my-0.5">
                                <span style={{ color: localSection.bulletColor || '#dc2626' }}>■</span>
                                <span className="font-semibold text-slate-900">{b}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {paragraphs.length > 0 ? (
                          paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                    ) : localSection.layout === 'right-img' ? (
                      <div
                        onClick={() => setActiveTarget('body')}
                        className={`font-martel leading-relaxed clearfix my-1 cursor-pointer rounded transition ${
                          (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                        } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                        style={{
                          fontFamily: localSection.bodyFont || "'Martel', serif",
                          fontSize: localSection.bodySize || '11px',
                          textAlign: localSection.bodyAlign || 'justify',
                          lineHeight: 1.38,
                          backgroundColor: '#fcfbfa',
                          color: '#111111',
                        }}
                      >
                        {localSection.image ? (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('image');
                            }}
                            className={`float-right w-[44%] max-w-[220px] ml-2 mb-1 border border-black p-0.5 bg-white cursor-pointer transition rounded ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                            }`}
                            title="क्लिक करके फोटो व लेआउट एडिट करें"
                          >
                            <img
                              src={localSection.image}
                              alt="Photo"
                              className="w-full max-h-44 object-cover"
                            />
                            {localSection.caption && (
                              <div className="text-[9.5px] italic text-slate-700 pt-0.5 text-center">
                                {localSection.caption}
                              </div>
                            )}
                          </div>
                        ) : null}
                        {bulletsList.length > 0 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTarget('bullets');
                            }}
                            className="p-1.5 mb-1 rounded border border-slate-300"
                            style={{ backgroundColor: localSection.bulletBgColor || 'transparent' }}
                          >
                            {bulletsList.map((b, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10.5px] leading-tight my-0.5">
                                <span style={{ color: localSection.bulletColor || '#dc2626' }}>■</span>
                                <span className="font-semibold text-slate-900">{b}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {paragraphs.length > 0 ? (
                          paragraphs.map((p, pIdx) => (
                            <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                    ) : localSection.layout === 'hero-split' ? (
                      <>
                        {localSection.image && (
                          <div
                            onClick={() => setActiveTarget('image')}
                            className={`my-1 cursor-pointer transition rounded ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                            }`}
                          >
                            <img
                              src={localSection.image}
                              alt="Photo"
                              className="w-full max-h-56 object-cover border border-black p-0.5"
                            />
                            {localSection.caption && (
                              <div
                                className="text-[9.5px] italic text-slate-700 pt-0.5"
                                style={{ textAlign: localSection.captionAlign || 'left' }}
                              >
                                {localSection.caption}
                              </div>
                            )}
                          </div>
                        )}
                        {bulletsList.length > 0 && (
                          <div
                            onClick={() => setActiveTarget('bullets')}
                            className={`my-1 cursor-pointer rounded transition ${
                              activeTarget === 'bullets' ? 'outline outline-2 outline-purple-500 bg-purple-500/10' : 'hover:outline hover:outline-1 hover:outline-purple-400'
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
                        <div
                          onClick={() => setActiveTarget('body')}
                          className={`font-martel leading-relaxed cursor-pointer rounded transition ${
                            (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                          } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                          style={{
                            fontFamily: localSection.bodyFont || "'Martel', serif",
                            fontSize: localSection.bodySize || '11px',
                            textAlign: localSection.bodyAlign || 'justify',
                            lineHeight: 1.38,
                            backgroundColor: '#fcfbfa',
                            color: '#111111',
                          }}
                        >
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                      </>
                    ) : localSection.layout === 'bottom-img' ? (
                      <>
                        {bulletsList.length > 0 && (
                          <div
                            onClick={() => setActiveTarget('bullets')}
                            className={`my-1 cursor-pointer rounded transition ${
                              activeTarget === 'bullets' ? 'outline outline-2 outline-purple-500 bg-purple-500/10' : 'hover:outline hover:outline-1 hover:outline-purple-400'
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
                        <div
                          onClick={() => setActiveTarget('body')}
                          className={`font-martel leading-relaxed my-0.5 cursor-pointer rounded transition ${
                            (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                          } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                          style={{
                            fontFamily: localSection.bodyFont || "'Martel', serif",
                            fontSize: localSection.bodySize || '11px',
                            textAlign: localSection.bodyAlign || 'justify',
                            lineHeight: 1.38,
                            backgroundColor: '#fcfbfa',
                            color: '#111111',
                          }}
                        >
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                        {localSection.image && (
                          <div
                            onClick={() => setActiveTarget('image')}
                            className={`my-1 cursor-pointer transition rounded ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
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
                                style={{ textAlign: localSection.captionAlign || 'left' }}
                              >
                                {localSection.caption}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : localSection.layout === 'text-only' ? (
                      <>
                        {bulletsList.length > 0 && (
                          <div
                            onClick={() => setActiveTarget('bullets')}
                            className={`my-1 cursor-pointer rounded transition ${
                              activeTarget === 'bullets' ? 'outline outline-2 outline-purple-500 bg-purple-500/10' : 'hover:outline hover:outline-1 hover:outline-purple-400'
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
                        <div
                          onClick={() => setActiveTarget('body')}
                          className={`font-martel leading-relaxed my-0.5 cursor-pointer rounded transition ${
                            (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                          } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                          style={{
                            fontFamily: localSection.bodyFont || "'Martel', serif",
                            fontSize: localSection.bodySize || '11px',
                            textAlign: localSection.bodyAlign || 'justify',
                            lineHeight: 1.38,
                            backgroundColor: '#fcfbfa',
                            color: '#111111',
                          }}
                        >
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                      </>
                    ) : (
                      // Default / top-img
                      <>
                        {localSection.image && (
                          <div
                            onClick={() => setActiveTarget('image')}
                            className={`my-1 cursor-pointer transition rounded ${
                              activeTarget === 'image' ? 'outline outline-2 outline-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
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
                                style={{ textAlign: localSection.captionAlign || 'left' }}
                              >
                                {localSection.caption}
                              </div>
                            )}
                          </div>
                        )}
                        {bulletsList.length > 0 && (
                          <div
                            onClick={() => setActiveTarget('bullets')}
                            className={`my-1 cursor-pointer rounded transition ${
                              activeTarget === 'bullets' ? 'outline outline-2 outline-purple-500 bg-purple-500/10' : 'hover:outline hover:outline-1 hover:outline-purple-400'
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
                        <div
                          onClick={() => setActiveTarget('body')}
                          className={`font-martel leading-relaxed cursor-pointer rounded transition ${
                            (localSection.bodyCols || 1) === 2 ? 'columns-2 gap-3.5' : (localSection.bodyCols || 1) === 3 ? 'columns-3 gap-3.5' : 'columns-1'
                          } ${activeTarget === 'body' ? 'outline outline-2 outline-emerald-500 bg-emerald-500/10' : 'hover:outline hover:outline-1 hover:outline-emerald-400'}`}
                          style={{
                            fontFamily: localSection.bodyFont || "'Martel', serif",
                            fontSize: localSection.bodySize || '11px',
                            textAlign: localSection.bodyAlign || 'justify',
                            lineHeight: 1.38,
                            backgroundColor: '#fcfbfa',
                            color: '#111111',
                          }}
                        >
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p, pIdx) => (
                              <p key={pIdx} className="story-paragraph mb-1 text-[#111111]">
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
                      </>
                    )}

                    {/* Bottom Clearfix to Guarantee White Paper Fully Covers Multi-Columns */}
                    <div style={{ clear: 'both', display: 'block', height: '1px', width: '100%' }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANE: DEDICATED EXTERNAL EDITOR TOOLBARS */}
          <div className="w-full md:w-[440px] lg:w-[480px] shrink-0 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">
            
            {/* Navigation Tabs Strip (Separated Kicker & Subheading) */}
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
                onClick={() => setActiveTarget('kicker')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'kicker'
                    ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🏷️</span>
                <span>किकर / टैग</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTarget('subheading')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTarget === 'subheading'
                    ? 'bg-orange-600 text-white shadow-md ring-1 ring-orange-400'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>🔖</span>
                <span>सबहेडिंग</span>
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
                        <label className="text-slate-400 text-[10px] font-semibold">फ़ॉन्ट साइज़ (Points / Decimals):</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="8"
                            max="120"
                            value={parseDecimalSize(localSection.fontSize, 22)}
                            onChange={(e) => updateField('fontSize', `${parseFloat(e.target.value) || 22}px`)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded text-red-400 font-mono font-bold text-xs px-1.5 py-0.5 text-right outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="10"
                          max="90"
                          step="0.1"
                          value={parseDecimalSize(localSection.fontSize, 22)}
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
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">हेडिंग रंग (Headline Color):</label>
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
                            onClick={() => updateField('titleAlign', a)}
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

              {/* 2. DEDICATED KICKER & CATEGORY TAG TOOLBAR */}
              {activeTarget === 'kicker' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-tag text-amber-400"></i> किकर व श्रेणी टैग एडिटर (Kicker & Tag)
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">सुपर हेडलाइन / किकर टेक्स्ट (Kicker):</label>
                      <input
                        type="text"
                        value={localSection.topLine || ''}
                        onChange={(e) => updateField('topLine', e.target.value)}
                        placeholder="e.g. मौसम विभाग की चेतावनी / विशेष रिपोर्ट..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium text-xs focus:border-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">श्रेणी टैग (Category Badge):</label>
                      <input
                        type="text"
                        value={localSection.tag || ''}
                        onChange={(e) => updateField('tag', e.target.value)}
                        placeholder="e.g. ब्रेकिंग न्यूज़, खास खबर, हिमाचल..."
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
                        <label className="text-slate-400 text-[10px] font-semibold">किकर साइज़ (Decimal Points):</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="8"
                            max="40"
                            value={parseDecimalSize(localSection.topLineSize, 13)}
                            onChange={(e) => updateField('topLineSize', `${parseFloat(e.target.value) || 13}px`)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded text-amber-300 font-mono font-bold text-xs px-1.5 py-0.5 text-right outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="36"
                        step="0.1"
                        value={parseDecimalSize(localSection.topLineSize, 13)}
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

              {/* 3. DEDICATED SUBHEADING TOOLBAR */}
              {activeTarget === 'subheading' && (
                <div className="space-y-4 text-slate-100 text-xs select-none">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-orange-400 text-xs flex items-center gap-1.5">
                      <i className="fa-solid fa-align-left text-orange-400"></i> सबहेडिंग एडिटर (Subtitle / Sub-headline)
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">
                      सबहेडिंग टेक्स्ट (Subtitle / Sub-headline):
                    </label>
                    <textarea
                      value={localSection.subtitle || ''}
                      onChange={(e) => updateField('subtitle', e.target.value)}
                      placeholder="e.g. अधिसूचना जारी; अगले महीने से सभी टनल पर कार्य शुरू होगा..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium text-xs focus:border-orange-500 outline-none leading-relaxed custom-scrollbar"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">सबहेडिंग फ़ॉन्ट:</label>
                      <select
                        value={localSection.subtitleFont || "'Martel', serif"}
                        onChange={(e) => updateField('subtitleFont', e.target.value)}
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
                        <label className="text-slate-400 text-[10px] font-semibold">सबहेडिंग साइज़ (Points / Decimals):</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="8"
                            max="50"
                            value={parseDecimalSize(localSection.subtitleSize, 12.5)}
                            onChange={(e) => updateField('subtitleSize', `${parseFloat(e.target.value) || 12.5}px`)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded text-orange-400 font-mono font-bold text-xs px-1.5 py-0.5 text-right outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="40"
                        step="0.1"
                        value={parseDecimalSize(localSection.subtitleSize, 12.5)}
                        onChange={(e) => updateField('subtitleSize', `${e.target.value}px`)}
                        className="w-full accent-orange-500 h-1.5 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold">सबहेडिंग रंग (Color):</label>
                      <div className="flex items-center gap-1.5">
                        {['#334155', '#111111', '#dc2626', '#0369a1', '#15803d'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => updateField('subtitleColor', c)}
                            className={`w-5 h-5 rounded-full border ${localSection.subtitleColor === c ? 'border-white scale-110 shadow' : 'border-slate-700'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <input
                          type="color"
                          value={localSection.subtitleColor || '#334155'}
                          onChange={(e) => updateField('subtitleColor', e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      <label className="text-slate-400 text-[10px] block mb-1 font-semibold mr-2">अलाइनमेंट:</label>
                      <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                        {['left', 'center', 'right'].map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => updateField('subtitleAlign', a)}
                            className={`px-2 py-1 rounded text-[10.5px] font-bold ${
                              (localSection.subtitleAlign || 'left') === a ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {a === 'left' ? '⬅️ Left' : a === 'center' ? '↔️ Center' : '➡️ Right'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MAIN NEWS (BODY) TOOLBAR */}
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
                        <label className="text-slate-400 text-[10px] font-semibold">फ़ॉन्ट साइज़ (Points / Decimals):</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="6"
                            max="36"
                            value={parseDecimalSize(localSection.bodySize, 11)}
                            onChange={(e) => updateField('bodySize', `${parseFloat(e.target.value) || 11}px`)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded text-emerald-400 font-mono font-bold text-xs px-1.5 py-0.5 text-right outline-none"
                          />
                          <span className="text-[10px] text-slate-400 font-mono">px</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="7"
                        max="26"
                        step="0.1"
                        value={parseDecimalSize(localSection.bodySize, 11)}
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
                            onClick={() => updateField('bodyCols', c)}
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
                            onClick={() => updateField('bodyAlign', a)}
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

              {/* 5. PHOTO & CAPTION TOOLBAR */}
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
                          onClick={() => updateField('layout', l.id)}
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
                              onClick={() => updateField('captionAlign', a)}
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

              {/* 6. BULLETS TOOLBAR */}
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

              {/* 7. BORDER & BACKGROUND TOOLBAR */}
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
