'use client';

import React, { useState, useEffect } from 'react';
import { SavedProject, EditorState, HeaderOverlayState } from '@/types/project';

export interface SaveDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, isNew: boolean) => Promise<void>;
  activeProject: SavedProject | null;
  currentState: EditorState;
  customHeaderState?: HeaderOverlayState;
  isSaving: boolean;
}

export const SaveDesignModal: React.FC<SaveDesignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  activeProject,
  currentState,
  isSaving
}) => {
  const [designName, setDesignName] = useState('');
  const [saveMode, setSaveMode] = useState<'update' | 'new'>('new');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (activeProject) {
        setDesignName(activeProject.name);
        setSaveMode('update');
      } else {
        const defaultName = `Design ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${currentState.paperMeta.title || 'Newspaper'}`;
        setDesignName(defaultName);
        setSaveMode('new');
      }
      setErrorMsg('');
    }
  }, [isOpen, activeProject, currentState]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designName.trim()) {
      setErrorMsg('कृपया डिज़ाइन का नाम दर्ज करें (Please enter a design name)');
      return;
    }

    try {
      await onSave(designName.trim(), saveMode === 'new');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save project');
    }
  };

  const totalSections = currentState.pages.reduce((acc, p) => acc + (p.sections?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white text-sm shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Save Newspaper Layout</h3>
              <p className="text-[11px] text-slate-400">IndexedDB High-Capacity Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {activeProject && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSaveMode('update')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  saveMode === 'update'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Update Existing</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveMode('new')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                  saveMode === 'new'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Save as New Copy</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Design / Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              placeholder="e.g. Design 1, Front Page Special, Morning Edition"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-medium text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              autoFocus
            />
          </div>

          {/* Project Details Snapshot */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <span className="text-slate-400 text-[11px] font-semibold block">Layout Snapshot:</span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9.5px]">Page Size</span>
                <span className="font-bold text-amber-300">{currentState.paperMeta.pageSize || '11x17'}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9.5px]">Total Pages</span>
                <span className="font-bold text-blue-300">{currentState.pages.length} Page(s)</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9.5px]">News/Ad Slots</span>
                <span className="font-bold text-emerald-300">{totalSections} Slots</span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <path strokeWidth="2" d="M12 8v4m0 4h.01" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving to IndexedDB...</span>
                </>
              ) : (
                <>
                  <span>Save Design</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
