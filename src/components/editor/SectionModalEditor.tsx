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

type ActiveTarget = 'heading' | 'subheading' | 'image' | 'body' | 'bullets' | 'border' | null;

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
      setActiveTarget(null);
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
      padding: '16px 20px',
      borderRadius: `${localSection.cardBorderRadius || 0}px`,
    };
  } else if (hasBg) {
    borderStyleStr = {
      backgroundColor: localSection.bgColor,
      padding: '12px 16px',
      borderRadius: '4px',
      border: '1px solid #cbd5e1',
    };
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden text-slate-100 font-sans"
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
                <span>न्यूज़ सेक्शन एडिटर (Interactive Direct Editor)</span>
                <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  {localSection.colSpan || 6} Col • {localSection.layout || 'standard'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                सीधे खबर के किसी भी हिस्से (हेडिंग, सबहेडिंग, फोटो, या मुख्य समाचार) पर क्लिक करके नीचे उसके टूलबार से एडिट करें।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
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

        {/* ================= TARGET NAVIGATION PILLS ================= */}
        <div className="px-4 sm:px-6 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
          <span className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider mr-1 hidden sm:inline">जंप टू:</span>

          <button
            type="button"
            onClick={() => setActiveTarget('heading')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTarget === 'heading'
                ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🔤</span>
            <span>हेडिंग (Heading)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('subheading')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTarget === 'subheading'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
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
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📄</span>
            <span>मुख्य समाचार (Body)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('image')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTarget === 'image'
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🖼️</span>
            <span>फोटो / लेआउट</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget('border')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTarget === 'border'
                ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400'
                : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🔲</span>
            <span>बॉर्डर व बैकग्राउंड</span>
          </button>
        </div>

        {/* ================= MAIN SCROLLABLE PREVIEW & TOOLBAR WORKSPACE ================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 flex flex-col items-center justify-start">
          <div
            className="w-full max-w-3xl rounded-xl shadow-2xl p-4 sm:p-7 relative select-text transition-all duration-150 bg-[#fcfbfa] text-[#111111]"
            style={borderStyleStr}
          >
            {/* 1. SUB-HEADING & TAG ROW */}
            <div
              onClick={() => setActiveTarget('subheading')}
              className={`cursor-pointer group relative p-1.5 -m-1 rounded-lg transition-all border-2 ${
                activeTarget === 'subheading'
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                  : 'border-transparent hover:border-amber-300/60 hover:bg-amber-50/40'
              }`}
              title="क्लिक करके सबहेडिंग / किकर एडिट करें"
            >
              <div className="flex items-center justify-between">
                <div
                  className="leading-snug pt-0.5 tracking-tight flex-1"
                  style={{
                    fontFamily: localSection.topLineFont || "'Mukta', sans-serif",
                    fontSize: localSection.topLineSize || '13px',
                    color: localSection.topLineColor || '#dc2626',
                    textAlign: localSection.topLineAlign || 'left',
                    fontWeight: localSection.topLineBold !== false ? 700 : 400,
                    fontStyle: localSection.topLineItalic ? 'italic' : 'normal',
                  }}
                >
                  {localSection.tag && (
                    <span
                      className="inline-block px-1.5 py-0.5 uppercase tracking-wide align-middle shadow-xs mr-1.5 rounded"
                      style={{
                        backgroundColor: localSection.tagBgColor || '#dc2626',
                        color: localSection.tagTextColor || '#ffffff',
                        fontSize: localSection.tagFontSize || '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      {localSection.tag}
                    </span>
                  )}
                  <span className="align-middle">
                    {localSection.topLine || (!localSection.tag && '[सुपर हेडलाइन / किकर जोड़ने के लिए यहाँ क्लिक करें]')}
                  </span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 ml-2 shrink-0 transition">
                  ✏️ सबहेडिंग एडिट
                </span>
              </div>
            </div>

            {/* SUB-HEADING TOOLBAR (EXPANDS DIRECTLY BELOW) */}
            {activeTarget === 'subheading' && (
              <div
                className="bg-slate-900 border-2 border-amber-500/80 rounded-xl p-3 sm:p-4 my-2 shadow-2xl text-slate-100 text-xs animate-fadeIn relative z-30 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <span>🏷️</span> <span>सबहेडिंग, किकर व श्रेणी टैग एडिटर</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTarget('heading')}
                    className="text-slate-400 hover:text-white text-[11px] font-semibold"
                  >
                    आगे हेडिंग पर जाएँ ↓
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">किकर (Kicker):</label>
                    <input
                      type="text"
                      value={localSection.topLine || ''}
                      onChange={(e) => updateField('topLine', e.target.value)}
                      placeholder="e.g. बड़ी खबर..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">टैग (Tag):</label>
                    <input
                      type="text"
                      value={localSection.tag || ''}
                      onChange={(e) => updateField('tag', e.target.value)}
                      placeholder="e.g. विशेष..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">उप-शीर्षक (Subtitle):</label>
                    <input
                      type="text"
                      value={localSection.subtitle || ''}
                      onChange={(e) => updateField('subtitle', e.target.value)}
                      placeholder="e.g. उप-शीर्षक लिखें..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800 items-end">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">फ़ॉन्ट स्टाइल:</label>
                    <select
                      value={localSection.topLineFont || "'Mukta', sans-serif"}
                      onChange={(e) => updateField('topLineFont', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none"
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
                      <label className="text-slate-400 text-[10px]">साइज़:</label>
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
                    <label className="text-slate-400 text-[10px] block mb-1">रंग:</label>
                    <div className="flex items-center gap-1">
                      {['#dc2626', '#0369a1', '#15803d', '#111111', '#d97706'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('topLineColor', c)}
                          className={`w-4 h-4 rounded-full border ${localSection.topLineColor === c ? 'border-white scale-110' : 'border-slate-700'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={localSection.topLineColor || '#dc2626'}
                        onChange={(e) => updateField('topLineColor', e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 ml-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => updateField('topLineAlign', a)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (localSection.topLineAlign || 'left') === a ? 'bg-amber-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          {a === 'left' ? '⬅️' : a === 'center' ? '↔️' : '➡️'}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateField('topLineItalic', !localSection.topLineItalic)}
                      className={`px-2 py-1 rounded text-[10.5px] font-serif italic border ${
                        localSection.topLineItalic ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MAIN HEADING (HEADLINE) */}
            <div
              onClick={() => setActiveTarget('heading')}
              className={`cursor-pointer group relative p-1.5 -m-1 my-1 rounded-lg transition-all border-2 ${
                activeTarget === 'heading'
                  ? 'border-red-500 bg-red-500/10 shadow-sm'
                  : 'border-transparent hover:border-red-300/60 hover:bg-red-50/40'
              }`}
              title="क्लिक करके मुख्य हेडिंग एडिट करें"
            >
              <div className="flex items-start justify-between gap-2">
                <h2
                  className="m-0 select-text flex-1"
                  style={{
                    fontFamily: localSection.titleFont || "'Rozha One', serif",
                    fontSize: localSection.fontSize || '26px',
                    color: localSection.titleColor || '#111111',
                    textAlign: localSection.titleAlign || 'left',
                    fontWeight: 800,
                    lineHeight: 1.2,
                  }}
                >
                  {localSection.title || 'मुख्य समाचार शीर्षक यहाँ लिखें'}
                </h2>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded border border-red-300 shrink-0 transition mt-1">
                  ✏️ हेडिंग एडिट
                </span>
              </div>
            </div>

            {/* HEADING TOOLBAR (EXPANDS DIRECTLY BELOW) */}
            {activeTarget === 'heading' && (
              <div
                className="bg-slate-900 border-2 border-red-500/90 rounded-xl p-3 sm:p-4 my-2.5 shadow-2xl text-slate-100 text-xs animate-fadeIn relative z-30 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <span className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <span>🔤</span> <span>मुख्य शीर्षक एडिटर (Headline Formatting)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteHeading}
                      className="px-2.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-red-300 hover:text-white rounded border border-red-900/60 text-[10.5px] font-semibold transition"
                    >
                      📋 हेडिंग पेस्ट करें
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTarget('body')}
                      className="text-slate-400 hover:text-white text-[11px] font-semibold"
                    >
                      आगे मुख्य समाचार पर जाएँ ↓
                    </button>
                  </div>
                </div>

                <div className="mb-2.5">
                  <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">
                    मुख्य शीर्षक (टाइप करें या पेस्ट करें):
                  </label>
                  <textarea
                    rows={2}
                    value={localSection.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="खबर का मुख्य शीर्षक..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-red-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800 items-end">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">फ़ॉन्ट स्टाइल:</label>
                    <select
                      value={localSection.titleFont || "'Rozha One', serif"}
                      onChange={(e) => updateField('titleFont', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none"
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
                      <label className="text-slate-400 text-[10px]">साइज़:</label>
                      <span className="text-red-400 font-mono font-bold text-[10px]">{localSection.fontSize || '26px'}</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="72"
                      step="1"
                      value={parseInt(localSection.fontSize || '26', 10)}
                      onChange={(e) => updateField('fontSize', `${e.target.value}px`)}
                      className="w-full accent-red-500 h-1.5 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">रंग:</label>
                    <div className="flex items-center gap-1">
                      {COLOR_PRESETS.slice(0, 5).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('titleColor', c)}
                          className={`w-4 h-4 rounded-full border ${localSection.titleColor === c ? 'border-white scale-110' : 'border-slate-700'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <input
                        type="color"
                        value={localSection.titleColor || '#111111'}
                        onChange={(e) => updateField('titleColor', e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 ml-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      {(['left', 'center', 'right', 'justify'] as const).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => updateField('titleAlign', a)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            (localSection.titleAlign || 'left') === a ? 'bg-red-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          {a === 'left' ? '⬅️' : a === 'center' ? '↔️' : '➡️'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PHOTO / IMAGE BLOCK */}
            <div
              onClick={() => setActiveTarget('image')}
              className={`cursor-pointer group relative p-1.5 -m-1 my-1.5 rounded-lg transition-all border-2 ${
                activeTarget === 'image'
                  ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                  : 'border-transparent hover:border-blue-300/60 hover:bg-blue-50/40'
              }`}
              title="क्लिक करके फोटो एडिट करें"
            >
              {localSection.image ? (
                <div>
                  <div className="w-full bg-slate-100 border border-slate-400 rounded-sm overflow-hidden">
                    <img
                      src={localSection.image}
                      alt="News Photo"
                      className="w-full object-cover block"
                      style={{ maxHeight: `${localSection.imageHeight || 220}px` }}
                    />
                  </div>
                  {localSection.caption && (
                    <p className="text-[11px] text-slate-600 italic mt-0.5 text-center font-sans">
                      {localSection.caption}
                    </p>
                  )}
                </div>
              ) : (
                <div className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 flex flex-col items-center justify-center text-slate-500">
                  <span className="text-xl mb-0.5">📷</span>
                  <span className="text-xs font-bold">➕ फोटो जोड़ने के लिए क्लिक करें</span>
                </div>
              )}
            </div>

            {/* IMAGE TOOLBAR (EXPANDS DIRECTLY BELOW) */}
            {activeTarget === 'image' && (
              <div
                className="bg-slate-900 border-2 border-blue-500/90 rounded-xl p-3 sm:p-4 my-2.5 shadow-2xl text-slate-100 text-xs animate-fadeIn relative z-30 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                    <span>🖼️</span> <span>फ़ोटो व कैप्शन सेटिंग्स</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow transition flex items-center gap-1.5"
                  >
                    <span>📁</span> <span>नई फ़ोटो अपलोड करें</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">फोटो URL:</label>
                    <input
                      type="text"
                      value={localSection.image || ''}
                      onChange={(e) => updateField('image', e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">कैप्शन:</label>
                    <input
                      type="text"
                      value={localSection.caption || ''}
                      onChange={(e) => updateField('caption', e.target.value)}
                      placeholder="फोटो कैप्शन..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800 items-center">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-400 text-[10px]">ऊंचाई (Height):</label>
                      <span className="text-blue-400 font-mono font-bold text-[10px]">{localSection.imageHeight || 220}px</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="450"
                      step="10"
                      value={localSection.imageHeight || 220}
                      onChange={(e) => updateField('imageHeight', parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500 h-1.5 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">फ़िट मोड:</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      {(['cover', 'contain'] as const).map((fit) => (
                        <button
                          key={fit}
                          type="button"
                          onClick={() => updateField('imageFit', fit)}
                          className={`py-0.5 rounded text-[10px] font-bold uppercase ${
                            (localSection.imageFit || 'cover') === fit ? 'bg-blue-600 text-white' : 'text-slate-400'
                          }`}
                        >
                          {fit}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. MAIN CONTENT (BODY TEXT) */}
            <div
              onClick={() => setActiveTarget('body')}
              className={`cursor-pointer group relative p-1.5 -m-1 my-1.5 rounded-lg transition-all border-2 ${
                activeTarget === 'body'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                  : 'border-transparent hover:border-emerald-300/60 hover:bg-emerald-50/40'
              }`}
              title="क्लिक करके मुख्य समाचार विवरण एडिट करें"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">मुख्य समाचार:</span>
                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 transition">
                  ✏️ टेक्स्ट एडिटर खोलें
                </span>
              </div>
              <div
                style={{
                  fontFamily: localSection.bodyFont || "'Martel', serif",
                  fontSize: localSection.bodySize || '11px',
                  color: localSection.bodyColor || '#111111',
                  textAlign: localSection.bodyAlign || 'justify',
                  lineHeight: 1.45,
                }}
              >
                {localSection.content || <span className="text-slate-400 italic">[मुख्य समाचार का टेक्स्ट यहाँ लिखें...]</span>}
              </div>
            </div>

            {/* MAIN CONTENT TOOLBAR (EXPANDS DIRECTLY BELOW) */}
            {activeTarget === 'body' && (
              <div
                className="bg-slate-900 border-2 border-emerald-500/90 rounded-xl p-3 sm:p-4 my-2.5 shadow-2xl text-slate-100 text-xs animate-fadeIn relative z-30 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span>📄</span> <span>मुख्य समाचार एडिटर (Body Text & Multi-Paragraphs)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteContent}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <span>📋</span> <span>क्लिपबोर्ड से पेस्ट करें</span>
                  </button>
                </div>

                <div className="mb-2.5">
                  <label className="text-slate-300 text-[10.5px] font-semibold block mb-1">
                    यहाँ खबर टाइप करें या कहीं से भी कॉपी-पेस्ट करें:
                  </label>
                  <textarea
                    rows={6}
                    value={localSection.content || ''}
                    onChange={(e) => updateField('content', e.target.value)}
                    placeholder="यहाँ मुख्य समाचार का टेक्स्ट लिखें..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs leading-relaxed focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-800 items-end">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">फ़ॉन्ट स्टाइल:</label>
                    <select
                      value={localSection.bodyFont || "'Martel', serif"}
                      onChange={(e) => updateField('bodyFont', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none"
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
                      <label className="text-slate-400 text-[10px]">साइज़:</label>
                      <span className="text-emerald-400 font-mono font-bold text-[10px]">{localSection.bodySize || '11px'}</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="22"
                      step="0.5"
                      value={parseFloat(localSection.bodySize || '11')}
                      onChange={(e) => updateField('bodySize', `${e.target.value}px`)}
                      className="w-full accent-emerald-500 h-1.5 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">कॉलम:</label>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateField('bodyCols', c)}
                          className={`py-1 rounded text-[10px] font-bold ${
                            (localSection.bodyCols || 1) === c ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {c} Col
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('bodyAlign', localSection.bodyAlign === 'justify' ? 'left' : 'justify')}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                        localSection.bodyAlign === 'justify' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {localSection.bodyAlign === 'justify' ? '☰ Justified' : '⬅️ Left'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('dropCap', !localSection.dropCap)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border ${
                        localSection.dropCap ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Drop Cap: {localSection.dropCap ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionModalEditor;
