'use client';

import React from 'react';
import { NewsSection } from '@/types/project';
import { useSectionInPlaceEditor } from '@/hooks/useSectionInPlaceEditor';
import { FloatingTypographyToolbar } from './FloatingTypographyToolbar';
import { ImageSwapPopover } from './ImageSwapPopover';

interface FocusedSectionEditorModalProps {
  section: NewsSection;
  onUpdateSection: (updated: NewsSection) => void;
  onClose: () => void;
}

export const FocusedSectionEditorModal: React.FC<FocusedSectionEditorModalProps> = ({
  section: initialSection,
  onUpdateSection,
  onClose,
}) => {
  const {
    section,
    activeElement,
    toolbarPos,
    isImagePopoverOpen,
    containerRef,
    updateField,
    selectSubElement,
    clearSelection,
    setIsImagePopoverOpen,
  } = useSectionInPlaceEditor(initialSection, onUpdateSection);

  const handleTypographyChange = (field: string, value: any) => {
    if (activeElement === 'heading') {
      if (field === 'fontSize') updateField('fontSize', value);
      if (field === 'fontFamily') updateField('titleFont', value);
      if (field === 'fontColor') updateField('titleColor', value);
      if (field === 'align') updateField('titleAlign', value);
      if (field === 'isItalic') updateField('titleItalic' as any, value);
    } else if (activeElement === 'subheading') {
      if (field === 'fontSize') updateField('subtitleSize', value);
      if (field === 'fontFamily') updateField('subtitleFont', value);
      if (field === 'fontColor') updateField('subtitleColor', value);
      if (field === 'align') updateField('subtitleAlign', value);
    } else if (activeElement === 'body') {
      if (field === 'fontSize') updateField('bodySize', value);
      if (field === 'fontFamily') updateField('bodyFont', value);
      if (field === 'fontColor') updateField('bodyColor', value);
      if (field === 'align') updateField('bodyAlign', value);
    } else if (activeElement === 'topline') {
      if (field === 'fontSize') updateField('topLineSize', value);
      if (field === 'fontFamily') updateField('topLineFont', value);
      if (field === 'fontColor') updateField('topLineColor', value);
    }
  };

  const getActiveStyleProps = () => {
    if (activeElement === 'heading') {
      return {
        fontSize: section.fontSize || '24px',
        fontFamily: section.titleFont || "'Rozha One', serif",
        fontColor: section.titleColor || '#111111',
        align: section.titleAlign || 'left',
      };
    }
    if (activeElement === 'subheading') {
      return {
        fontSize: section.subtitleSize || '14px',
        fontFamily: section.subtitleFont || "'Martel', serif",
        fontColor: section.subtitleColor || '#334155',
        align: section.subtitleAlign || 'left',
      };
    }
    if (activeElement === 'body') {
      return {
        fontSize: section.bodySize || '13px',
        fontFamily: section.bodyFont || "'Mukta', sans-serif",
        fontColor: section.bodyColor || '#111111',
        align: section.bodyAlign || 'left',
      };
    }
    return {};
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onClick={clearSelection}
    >
      <div 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Focused Section In-Place Editor
            </h2>
            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
              Click any text or photo to edit in-place
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            ✓ Done / Back to E-Paper
          </button>
        </div>

        {/* Floating Typography Toolbar */}
        {toolbarPos && activeElement && activeElement !== 'image' && (
          <FloatingTypographyToolbar
            position={toolbarPos}
            {...getActiveStyleProps()}
            onChangeStyle={handleTypographyChange}
          />
        )}

        {/* Canvas Card Area */}
        <div className="p-6 bg-slate-950/60 overflow-y-auto max-h-[75vh] flex justify-center">
          <div 
            className="w-full max-w-2xl bg-[#fcfbfa] text-[#111111] p-6 rounded-lg shadow-xl border border-slate-300 relative transition-all"
            style={{
              backgroundColor: section.bgColor || '#fcfbfa',
              border: section.showCardBorder ? `${section.cardBorderWidth || 1}px solid ${section.cardBorderColor || '#000000'}` : '1px solid #d1d5db',
            }}
          >
            {/* 1. TOPLINE / KICKER */}
            {(section.topLine || activeElement === 'topline') && (
              <div
                onClick={(e) => selectSubElement('topline', e)}
                className={`mb-1 transition-all rounded px-1.5 py-0.5 cursor-text ${
                  activeElement === 'topline' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                }`}
              >
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField('topLine', e.currentTarget.textContent || '')}
                  className="outline-none block uppercase font-bold tracking-wide"
                  style={{
                    fontFamily: section.topLineFont || "'Mukta', sans-serif",
                    fontSize: section.topLineSize || '11px',
                    color: section.topLineColor || '#dc2626',
                  }}
                >
                  {section.topLine || 'सुपर हेडलाइन लिखें...'}
                </span>
              </div>
            )}

            {/* 2. MAIN HEADLINE */}
            <div
              onClick={(e) => selectSubElement('heading', e)}
              className={`transition-all rounded px-1.5 py-1 mb-2 cursor-text ${
                activeElement === 'heading' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
              }`}
            >
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateField('title', e.currentTarget.textContent || '')}
                className="outline-none block leading-tight font-extrabold"
                style={{
                  fontFamily: section.titleFont || "'Rozha One', serif",
                  fontSize: section.fontSize || '26px',
                  color: section.titleColor || '#111111',
                  textAlign: section.titleAlign || 'left',
                }}
              >
                {section.title}
              </h2>
            </div>

            {/* 3. SUBHEADING */}
            {(section.subtitle || activeElement === 'subheading') && (
              <div
                onClick={(e) => selectSubElement('subheading', e)}
                className={`transition-all rounded px-1.5 py-0.5 mb-3 cursor-text ${
                  activeElement === 'subheading' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
                }`}
              >
                <h3
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateField('subtitle', e.currentTarget.textContent || '')}
                  className="outline-none block italic font-medium leading-snug"
                  style={{
                    fontFamily: section.subtitleFont || "'Martel', serif",
                    fontSize: section.subtitleSize || '14px',
                    color: section.subtitleColor || '#334155',
                    textAlign: section.subtitleAlign || 'left',
                  }}
                >
                  {section.subtitle || 'उप-शीर्षक लिखें...'}
                </h3>
              </div>
            )}

            {/* 4. PHOTO / IMAGE SLOT */}
            {section.layout !== 'no-img' && (
              <div
                onClick={(e) => selectSubElement('image', e)}
                className={`relative mb-3 group cursor-pointer rounded-md overflow-hidden transition-all ${
                  activeElement === 'image' ? 'ring-2 ring-blue-500' : 'hover:outline hover:outline-2 hover:outline-blue-400'
                }`}
              >
                {section.image ? (
                  <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
                    <img
                      src={section.image}
                      alt={section.title}
                      className={`w-full h-full object-${section.imageFit || 'cover'}`}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <span>📷 Replace Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-36 border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-4">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs font-bold text-slate-600">Click to Add/Upload Photo</span>
                  </div>
                )}

                {/* Caption */}
                {section.caption && (
                  <div className="text-[11px] text-slate-600 italic mt-1 px-1 font-serif">
                    {section.caption}
                  </div>
                )}
              </div>
            )}

            {/* 5. EDITORIAL BODY CONTENT */}
            <div
              onClick={(e) => selectSubElement('body', e)}
              className={`transition-all rounded px-2 py-1.5 cursor-text ${
                activeElement === 'body' ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:outline hover:outline-1 hover:outline-blue-400'
              }`}
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => updateField('content', e.currentTarget.innerHTML || '')}
                className="outline-none leading-relaxed text-justify"
                style={{
                  fontFamily: section.bodyFont || "'Mukta', sans-serif",
                  fontSize: section.bodySize || '13px',
                  color: section.bodyColor || '#111111',
                  textAlign: section.bodyAlign || 'left',
                }}
                dangerouslySetInnerHTML={{ __html: section.content || 'समाचार का मुख्य विवरण यहाँ लिखें...' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Helper Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>💡 Click outside or click <strong className="text-slate-200">Done</strong> to finish editing</span>
          <span className="font-mono text-slate-400">Live Sync: Active ⚡</span>
        </div>
      </div>

      {/* Image Swap Popover Modal */}
      {isImagePopoverOpen && (
        <ImageSwapPopover
          currentImage={section.image}
          currentCaption={section.caption}
          imageFit={section.imageFit}
          onSave={({ image, caption, imageFit }) => {
            updateField('image', image);
            updateField('caption', caption);
            updateField('imageFit', imageFit);
          }}
          onClose={() => setIsImagePopoverOpen(false)}
        />
      )}
    </div>
  );
};
