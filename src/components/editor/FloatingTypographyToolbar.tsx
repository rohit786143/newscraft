'use client';

import React from 'react';
import { ToolbarPosition } from '@/hooks/useSectionInPlaceEditor';

interface FloatingTypographyToolbarProps {
  position: ToolbarPosition;
  fontSize?: string;
  fontFamily?: string;
  fontColor?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: string;
  isBold?: boolean;
  isItalic?: boolean;
  onChangeStyle: (field: string, value: any) => void;
}

const POPULAR_FONTS = [
  { label: 'Rozha One (Headline)', value: "'Rozha One', serif" },
  { label: 'Mukta (Clean)', value: "'Mukta', sans-serif" },
  { label: 'Martel (Editorial)', value: "'Martel', serif" },
  { label: 'Noto Serif Devanagari', value: "'Noto Serif Devanagari', serif" },
  { label: 'Yatra One (Traditional)', value: "'Yatra One', cursive" },
  { label: 'Inter (Modern Sans)', value: "'Inter', sans-serif" },
];

export const FloatingTypographyToolbar: React.FC<FloatingTypographyToolbarProps> = ({
  position,
  fontSize = '18px',
  fontFamily = "'Mukta', sans-serif",
  fontColor = '#111111',
  align = 'left',
  isBold = false,
  isItalic = false,
  onChangeStyle,
}) => {
  const numericSize = parseFloat(fontSize) || 16;

  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/95 text-slate-200 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md text-xs select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Font Family Selector */}
      <select
        value={fontFamily}
        onChange={(e) => onChangeStyle('fontFamily', e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-2 py-1 text-[11px] font-medium outline-none hover:border-slate-500 focus:border-blue-500 cursor-pointer max-w-[120px] truncate"
      >
        {POPULAR_FONTS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      {/* Font Size Step Controls */}
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-1 py-0.5">
        <button
          type="button"
          onClick={() => onChangeStyle('fontSize', `${Math.max(8, numericSize - 1)}px`)}
          className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-slate-300 font-bold cursor-pointer"
          title="Decrease Size"
        >
          -
        </button>
        <span className="px-1 text-[11px] font-mono font-bold text-amber-400 min-w-[28px] text-center">
          {numericSize}
        </span>
        <button
          type="button"
          onClick={() => onChangeStyle('fontSize', `${numericSize + 1}px`)}
          className="px-1.5 py-0.5 hover:bg-slate-700 rounded text-slate-300 font-bold cursor-pointer"
          title="Increase Size"
        >
          +
        </button>
      </div>

      {/* Bold & Italic Toggles */}
      <button
        type="button"
        onClick={() => onChangeStyle('isBold', !isBold)}
        className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
          isBold ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => onChangeStyle('isItalic', !isItalic)}
        className={`px-2 py-1 rounded-lg italic font-serif transition cursor-pointer ${
          isItalic ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
        }`}
        title="Italic"
      >
        I
      </button>

      {/* Text Alignment */}
      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
        {(['left', 'center', 'right', 'justify'] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChangeStyle('align', a)}
            className={`px-1.5 py-0.5 rounded capitalize text-[10px] cursor-pointer ${
              align === a ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {a === 'left' ? 'L' : a === 'center' ? 'C' : a === 'right' ? 'R' : 'J'}
          </button>
        ))}
      </div>

      {/* Color Picker Swatch */}
      <div className="relative flex items-center" title="Text Color">
        <input
          type="color"
          value={fontColor}
          onChange={(e) => onChangeStyle('fontColor', e.target.value)}
          className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-none outline-none"
        />
      </div>
    </div>
  );
};
