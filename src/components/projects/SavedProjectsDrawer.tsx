'use client';

import React, { useState } from 'react';
import { SavedProject } from '@/types/project';
import { generateFallbackThumbnail } from '@/lib/editor/stateSerializer';

export interface SavedProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  activeProjectId?: string;
  onSelectProject: (id: string) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onDuplicateProject: (id: string) => Promise<void>;
  onNewDesignClick?: () => void;
  isLoading: boolean;
}

export const SavedProjectsDrawer: React.FC<SavedProjectsDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onNewDesignClick,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.pageSize.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      await onSelectProject(id);
      onClose();
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`क्या आप डिज़ाइन "${name}" को डिलीट करना चाहते हैं? (Are you sure you want to delete this design?)`)) {
      setDeletingId(id);
      try {
        await onDeleteProject(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('hi-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-base shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>My Saved Designs & Templates</span>
                <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/60">
                  {projects.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">IndexedDB Local Storage • Instant Hydration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNewDesignClick && (
              <button
                onClick={() => {
                  onNewDesignClick();
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <span>+ New Blank Canvas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved designs by name or size..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
            <svg
              className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
            >
              Clear
            </button>
          )}
        </div>

        {/* Projects Grid Container */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-semibold">Loading your designs from IndexedDB...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 text-2xl mb-3">
                📰
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                {searchQuery ? 'No designs match your search' : 'No Saved Designs Yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {searchQuery
                  ? 'Try a different search keyword or clear the search filter.'
                  : 'Click the "Save Design" button in the top toolbar to save your current layout as a reusable project!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {filteredProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                const isItemLoading = loadingId === project.id;
                const isItemDeleting = deletingId === project.id;

                return (
                  <div
                    key={project.id}
                    className={`group relative bg-slate-950/90 border rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col hover:border-blue-500/80 hover:shadow-blue-500/10 ${
                      isActive
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Thumbnail Preview Banner */}
                    <div
                      onClick={() => handleSelect(project.id)}
                      className="relative w-full aspect-[3/4] bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center group-hover:scale-[1.01] transition duration-300"
                    >
                      <img
                        src={project.thumbnail && project.thumbnail.startsWith('data:image/') ? project.thumbnail : generateFallbackThumbnail(project)}
                        alt={project.name}
                        className="w-full h-full object-cover object-top border-b border-slate-800"
                      />

                      {/* Active Pill */}
                      {isActive && (
                        <div className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Currently Active</span>
                        </div>
                      )}

                      {/* Page Size Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-amber-900/60 shadow">
                        {project.pageSize}
                      </div>

                      {/* Hover Overlay with Edit Action */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition flex items-center justify-center">
                        <span className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition">
                          <span>Open in Editor</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>

                    {/* Card Content Info */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-slate-950">
                      <div>
                        <h4
                          onClick={() => handleSelect(project.id)}
                          className="font-bold text-xs text-white group-hover:text-blue-400 transition cursor-pointer truncate"
                          title={project.name}
                        >
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{project.pageCount} Page(s)</span>
                          <span>•</span>
                          <span>{project.sectionCount || 0} Slots</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Saved: {formatTime(project.updatedAt)}
                        </span>
                      </div>

                      {/* Action Buttons Bar */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleSelect(project.id)}
                          disabled={isItemLoading}
                          className="col-span-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                          title="Edit this layout in the studio"
                        >
                          {isItemLoading ? '...' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(project.id)}
                          className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition flex items-center justify-center gap-1"
                          title="Duplicate Design"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id, project.name)}
                          disabled={isItemDeleting}
                          className="py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-lg font-semibold transition flex items-center justify-center"
                          title="Delete Design"
                        >
                          {isItemDeleting ? '...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>
            {projects.length > 0
              ? `${projects.length} design(s) stored in browser database`
              : 'Zero cloud dependencies'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
