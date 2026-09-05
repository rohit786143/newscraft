'use client';

import React, { useState } from 'react';

interface ImageSwapPopoverProps {
  currentImage?: string;
  currentCaption?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  onSave: (imgData: { image: string; caption: string; imageFit: 'cover' | 'contain' | 'fill' }) => void;
  onClose: () => void;
}

export const ImageSwapPopover: React.FC<ImageSwapPopoverProps> = ({
  currentImage = '',
  currentCaption = '',
  imageFit = 'cover',
  onSave,
  onClose,
}) => {
  const [imageUrl, setImageUrl] = useState(currentImage);
  const [caption, setCaption] = useState(currentCaption);
  const [fit, setFit] = useState(imageFit);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    onSave({ image: imageUrl, caption, imageFit: fit });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🖼️</span> Replace / Edit Section Photo
          </h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white text-lg px-2 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live Preview */}
        <div className="mt-4 w-full h-36 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className={`w-full h-full object-${fit}`} />
          ) : (
            <span className="text-xs text-slate-500 font-medium">No Image Selected</span>
          )}
        </div>

        {/* Upload Buttons */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Upload from Computer (JPG / PNG)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Or Image URL
            </label>
            <input
              type="text"
              value={imageUrl}
              placeholder="https://..."
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Photo Caption
            </label>
            <input
              type="text"
              value={caption}
              placeholder="फोटो कैप्शन लिखें..."
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          {/* Fit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold">Aspect Fit:</span>
            {(['cover', 'contain', 'fill'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFit(f)}
                className={`px-2.5 py-1 rounded-lg text-xs capitalize cursor-pointer ${
                  fit === f ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            Apply Image
          </button>
        </div>
      </div>
    </div>
  );
};
