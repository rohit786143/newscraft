import React, { useState, useRef, useEffect } from 'react';

/**
 * SectionModalEditor (Production-Ready React Component)
 *
 * Lightbox Modal for focused in-place editing of individual news blocks.
 * - Leaves the left sidebar configuration panel untouched.
 * - Supports targeted sub-element editing ('heading' | 'subheading' | 'image' | 'body').
 * - Real-time state synchronization with undo/cancel protection.
 */
export const SectionModalEditor = ({
  isOpen,
  section,
  onClose,
  onSave,
  onChange,
}) => {
  const [localSection, setLocalSection] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const fileInputRef = useRef(null);

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

  const updateField = (field, value) => {
    const updated = { ...localSection, [field]: value };
    setLocalSection(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      updateField('image', objectUrl);
    }
  };

  const handleSaveAndClose = () => {
    if (localSection) {
      onSave(localSection);
    }
    onClose();
  };

  const colorPresets = ['#111111', '#dc2626', '#991b1b', '#0369a1', '#1e3a8a', '#15803d', '#475569'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center font-bold text-sm">
              📰
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <span>न्यूज़ सेक्शन एडिटर (Interactive Modal)</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                  {localSection.colSpan || 6} Col • {localSection.layout || 'standard'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                सीधे खबर के किसी भी हिस्से (हेडिंग, सबहेडिंग, फोटो, या बॉडी टेक्स्ट) पर क्लिक करके एडिट करें।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>💾</span>
              <span>सेव और बंद करें (Save & Close)</span>
            </button>
          </div>
        </div>

        {/* CONTEXTUAL TOOLBAR STRIP */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-2 min-h-[50px]">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTarget('heading')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTarget === 'heading'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🔤</span>
              <span>हेडिंग (Heading)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('subheading')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTarget === 'subheading'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🏷️</span>
              <span>सबहेडिंग / किकर</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('image')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTarget === 'image'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🖼️</span>
              <span>फ़ोटो (Image)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTarget('body')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTarget === 'body'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>📄</span>
              <span>बॉडी टेक्स्ट (Body)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* HEADING TOOLBAR */}
            {activeTarget === 'heading' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">फ़ॉन्ट साइज़:</span>
                  <select
                    value={localSection.fontSize || '26px'}
                    onChange={(e) => updateField('fontSize', e.target.value)}
                    className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-slate-700 outline-none"
                  >
                    {['20px', '22px', '24px', '26px', '28px', '32px', '36px', '40px', '48px', '54px', '64px'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                  {['left', 'center', 'right', 'justify'].map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => updateField('titleAlign', align)}
                      className={`px-2 py-1 rounded text-xs font-bold capitalize ${
                        (localSection.titleAlign || 'left') === align
                          ? 'bg-red-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {align === 'left' ? '⬅️' : align === 'center' ? '↔️' : align === 'right' ? '➡️' : '☰'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">रंग:</span>
                  {colorPresets.slice(0, 4).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => updateField('titleColor', c)}
                      className={`w-4 h-4 rounded-full border ${
                        localSection.titleColor === c ? 'border-white scale-110' : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={localSection.titleColor || '#111111'}
                    onChange={(e) => updateField('titleColor', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0 ml-1"
                  />
                </div>
              </div>
            )}

            {/* SUBHEADING TOOLBAR */}
            {activeTarget === 'subheading' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">किकर रंग:</span>
                  <input
                    type="color"
                    value={localSection.topLineColor || '#dc2626'}
                    onChange={(e) => updateField('topLineColor', e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">साइज़:</span>
                  <select
                    value={localSection.subtitleSize || '14px'}
                    onChange={(e) => updateField('subtitleSize', e.target.value)}
                    className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-slate-700 outline-none"
                  >
                    {['11px', '12px', '13px', '14px', '15px', '16px', '18px'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => updateField('topLineItalic', !localSection.topLineItalic)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-serif italic ${
                    localSection.topLineItalic
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  Italic (इटैलिक)
                </button>
              </div>
            )}

            {/* IMAGE TOOLBAR */}
            {activeTarget === 'image' && (
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>📁</span>
                  <span>नई फ़ोटो अपलोड करें</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">फ़िट:</span>
                  {['cover', 'contain'].map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => updateField('imageFit', fit)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        (localSection.imageFit || 'cover') === fit
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">ऊंचाई: {localSection.imageHeight || 180}px</span>
                  <input
                    type="range"
                    min="80"
                    max="450"
                    step="10"
                    value={localSection.imageHeight || 180}
                    onChange={(e) => updateField('imageHeight', parseInt(e.target.value, 10))}
                    className="w-20 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* BODY TOOLBAR */}
            {activeTarget === 'body' && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                  <span className="text-slate-400 text-[11px]">साइज़:</span>
                  <select
                    value={localSection.bodySize || '13px'}
                    onChange={(e) => updateField('bodySize', e.target.value)}
                    className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-slate-700 outline-none"
                  >
                    {['11px', '12px', '13px', '14px', '15px', '16px'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    updateField('bodyAlign', localSection.bodyAlign === 'justify' ? 'left' : 'justify')
                  }
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 ${
                    localSection.bodyAlign === 'justify'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>☰</span>
                  <span>{localSection.bodyAlign === 'justify' ? 'Justified' : 'Left Align'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('dropCap', !localSection.dropCap)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                    localSection.dropCap
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  Drop Cap: {localSection.dropCap ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE & PREVIEW */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-950 flex flex-col md:flex-row gap-6">
          {/* PREVIEW BLOCK */}
          <div className="flex-1 flex flex-col items-center justify-start">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>📰 लाइव ई-पेपर प्रीव्यू (Live Canvas Preview)</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">क्लिक करके एडिट करें</span>
            </div>

            <div
              className="w-full max-w-2xl bg-[#fcfbfa] text-[#111111] p-6 rounded shadow-2xl border border-slate-300 relative transition-all"
              style={{
                fontFamily: "'Noto Serif Devanagari', 'Martel', serif",
                lineHeight: 1.4,
              }}
            >
              {/* KICKER / TOPLINE */}
              <div
                onClick={() => setActiveTarget('subheading')}
                className={`cursor-pointer p-1 rounded transition-all mb-1 ${
                  activeTarget === 'subheading'
                    ? 'ring-2 ring-amber-500 bg-amber-500/10'
                    : 'hover:bg-amber-500/5 hover:outline-dashed hover:outline-1 hover:outline-amber-400/50'
                }`}
              >
                {localSection.tag && (
                  <span
                    className="inline-block px-1.5 py-0.5 uppercase tracking-wide text-[10px] font-bold text-white rounded mr-1.5"
                    style={{ backgroundColor: localSection.tagBgColor || '#dc2626' }}
                  >
                    {localSection.tag}
                  </span>
                )}
                {localSection.topLine && (
                  <span
                    style={{
                      color: localSection.topLineColor || '#dc2626',
                      fontSize: localSection.topLineSize || '13px',
                      fontStyle: localSection.topLineItalic ? 'italic' : 'normal',
                      fontWeight: 'bold',
                    }}
                  >
                    {localSection.topLine}
                  </span>
                )}
                {!localSection.tag && !localSection.topLine && (
                  <span className="text-xs text-slate-400 italic">
                    + सबहेडिंग / किकर जोड़ने के लिए क्लिक करें
                  </span>
                )}
              </div>

              {/* HEADING */}
              <div
                onClick={() => setActiveTarget('heading')}
                className={`cursor-pointer p-1 rounded transition-all my-1.5 ${
                  activeTarget === 'heading'
                    ? 'ring-2 ring-red-500 bg-red-500/10'
                    : 'hover:bg-red-500/5 hover:outline-dashed hover:outline-1 hover:outline-red-400/50'
                }`}
              >
                <h2
                  style={{
                    fontFamily: localSection.titleFont || "'Rozha One', serif",
                    fontSize: localSection.fontSize || '26px',
                    color: localSection.titleColor || '#111111',
                    textAlign: localSection.titleAlign || 'left',
                    fontWeight: 800,
                    lineHeight: 1.18,
                  }}
                >
                  {localSection.title || 'शीर्षक यहाँ लिखें...'}
                </h2>
                {localSection.subtitle && (
                  <h3
                    className="italic mt-1"
                    style={{
                      fontSize: localSection.subtitleSize || '13px',
                      color: localSection.subtitleColor || '#475569',
                    }}
                  >
                    {localSection.subtitle}
                  </h3>
                )}
              </div>

              {/* IMAGE */}
              {localSection.layout !== 'no-img' && (
                <div
                  onClick={() => setActiveTarget('image')}
                  className={`cursor-pointer p-1 rounded transition-all my-2 ${
                    activeTarget === 'image'
                      ? 'ring-2 ring-blue-500 bg-blue-500/10'
                      : 'hover:bg-blue-500/5 hover:outline-dashed hover:outline-1 hover:outline-blue-400/50'
                  }`}
                >
                  <div
                    className="w-full bg-slate-100 border border-slate-300 rounded overflow-hidden relative"
                    style={{ height: `${localSection.imageHeight || 180}px` }}
                  >
                    {localSection.image ? (
                      <img
                        src={localSection.image}
                        alt={localSection.caption || 'News Photo'}
                        className="w-full h-full block"
                        style={{ objectFit: localSection.imageFit || 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 border-2 border-dashed border-slate-300">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs font-bold text-slate-600">फ़ोटो अपलोड करने के लिए क्लिक करें</span>
                      </div>
                    )}
                  </div>
                  {localSection.caption && (
                    <div className="text-[11px] text-slate-600 italic mt-1 text-center font-sans">
                      {localSection.caption}
                    </div>
                  )}
                </div>
              )}

              {/* BODY */}
              <div
                onClick={() => setActiveTarget('body')}
                className={`cursor-pointer p-1.5 rounded transition-all mt-2 ${
                  activeTarget === 'body'
                    ? 'ring-2 ring-emerald-500 bg-emerald-500/10'
                    : 'hover:bg-emerald-500/5 hover:outline-dashed hover:outline-1 hover:outline-emerald-400/50'
                }`}
              >
                <div
                  style={{
                    fontSize: localSection.bodySize || '13px',
                    color: localSection.bodyColor || '#111111',
                    textAlign: localSection.bodyAlign || 'justify',
                    lineHeight: 1.42,
                  }}
                >
                  {localSection.dropCap && localSection.content && (
                    <span className="float-left text-3xl font-bold font-serif leading-none mr-1.5 mt-0.5 text-red-700">
                      {localSection.content.trim().charAt(0)}
                    </span>
                  )}
                  {localSection.content ? (
                    localSection.dropCap ? (
                      localSection.content.trim().slice(1)
                    ) : (
                      localSection.content
                    )
                  ) : (
                    <span className="text-slate-400 italic">समाचार का मुख्य विवरण यहाँ लिखें...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* INPUT FORM PANEL */}
          <div className="w-full md:w-96 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shrink-0 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>✏️</span>
                <span>
                  {activeTarget === 'heading' && 'हेडिंग संपादन (Headline Edit)'}
                  {activeTarget === 'subheading' && 'सबहेडिंग संपादन (Sub-heading Edit)'}
                  {activeTarget === 'image' && 'फ़ोटो व कैप्शन (Media Edit)'}
                  {activeTarget === 'body' && 'बॉडी टेक्स्ट संपादन (Content Edit)'}
                  {!activeTarget && 'सेक्शन का कोई भाग चुनें'}
                </span>
              </span>
            </div>

            {activeTarget === 'heading' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">मुख्य शीर्षक (Title)</label>
                  <textarea
                    rows={3}
                    value={localSection.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="खबर का मुख्य शीर्षक..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-medium focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">उप-शीर्षक (Subtitle)</label>
                  <input
                    type="text"
                    value={localSection.subtitle || ''}
                    onChange={(e) => updateField('subtitle', e.target.value)}
                    placeholder="वैकल्पिक उप-शीर्षक..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            )}

            {activeTarget === 'subheading' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">सुपर हेडलाइन / किकर (Topline)</label>
                  <input
                    type="text"
                    value={localSection.topLine || ''}
                    onChange={(e) => updateField('topLine', e.target.value)}
                    placeholder="उदा. बड़ी खबर, विशेष रिपोर्ट..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">श्रेणी टैग (Badge Tag)</label>
                  <input
                    type="text"
                    value={localSection.tag || ''}
                    onChange={(e) => updateField('tag', e.target.value)}
                    placeholder="उदा. राजनीति, क्राइम, खेल..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            )}

            {activeTarget === 'image' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">इमेज URL / लिंक</label>
                  <input
                    type="text"
                    value={localSection.image || ''}
                    onChange={(e) => updateField('image', e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">फ़ोटो कैप्शन (Photo Caption)</label>
                  <input
                    type="text"
                    value={localSection.caption || ''}
                    onChange={(e) => updateField('caption', e.target.value)}
                    placeholder="फ़ोटो के बारे में संक्षिप्त विवरण..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {activeTarget === 'body' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">समाचार विवरण (Story Content)</label>
                  <textarea
                    rows={8}
                    value={localSection.content || ''}
                    onChange={(e) => updateField('content', e.target.value)}
                    placeholder="समाचार का पूरा विवरण यहाँ टाइप करें..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
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
