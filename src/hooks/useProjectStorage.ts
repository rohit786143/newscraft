'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedProject, EditorState, HeaderOverlayState } from '@/types/project';
import {
  getAllProjects,
  getProjectById,
  saveProject as dbSaveProject,
  deleteProject as dbDeleteProject,
  duplicateProject as dbDuplicateProject
} from '@/lib/storage/projectDb';
import {
  serializeEditorState,
  loadEditorState,
  generateProjectThumbnail,
  DEFAULT_STUDIO_STATE
} from '@/lib/editor/stateSerializer';

export interface UseProjectStorageReturn {
  projects: SavedProject[];
  activeProject: SavedProject | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSavedTime: string | null;
  refreshProjects: () => Promise<void>;
  saveCurrentProject: (
    name: string,
    currentState: EditorState,
    customHeaderState?: HeaderOverlayState,
    existingId?: string
  ) => Promise<SavedProject>;
  loadProject: (id: string) => Promise<EditorState>;
  deleteProject: (id: string) => Promise<boolean>;
  duplicateProject: (id: string) => Promise<SavedProject>;
  setActiveProject: (project: SavedProject | null) => void;
}

export function useProjectStorage(): UseProjectStorageReturn {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [activeProject, setActiveProject] = useState<SavedProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await getAllProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const saveCurrentProject = useCallback(
    async (
      name: string,
      currentState: EditorState,
      customHeaderState?: HeaderOverlayState,
      existingId?: string
    ): Promise<SavedProject> => {
      setIsSaving(true);
      try {
        const serialized = serializeEditorState(currentState, customHeaderState);
        const thumbnail = await generateProjectThumbnail('newspaperWrapper');

        const now = new Date().toISOString();
        const projectId = existingId || activeProject?.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // Calculate total section count
        const sectionCount = serialized.pages.reduce((acc, p) => acc + (p.sections?.length || 0), 0);

        const projectPayload: SavedProject = {
          id: projectId,
          name: name.trim() || 'Untitled Newspaper Design',
          thumbnail,
          createdAt: existingId && activeProject?.createdAt ? activeProject.createdAt : now,
          updatedAt: now,
          pageSize: serialized.paperMeta.pageSize || '11x17',
          pageCount: serialized.pages.length,
          sectionCount,
          stateData: serialized
        };

        const saved = await dbSaveProject(projectPayload);
        setActiveProject(saved);
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
        await refreshProjects();
        return saved;
      } finally {
        setIsSaving(false);
      }
    },
    [activeProject, refreshProjects]
  );

  const loadProject = useCallback(
    async (id: string): Promise<EditorState> => {
      const proj = await getProjectById(id);
      if (!proj) {
        throw new Error(`Project ${id} not found.`);
      }

      setActiveProject(proj);
      const hydrated = loadEditorState(proj);
      setLastSavedTime(
        new Date(proj.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      return hydrated;
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await dbDeleteProject(id);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
      await refreshProjects();
      return success;
    },
    [activeProject, refreshProjects]
  );

  const duplicateProject = useCallback(
    async (id: string): Promise<SavedProject> => {
      const cloned = await dbDuplicateProject(id);
      await refreshProjects();
      return cloned;
    },
    [refreshProjects]
  );

  return {
    projects,
    activeProject,
    isLoading,
    isSaving,
    lastSavedTime,
    refreshProjects,
    saveCurrentProject,
    loadProject,
    deleteProject,
    duplicateProject,
    setActiveProject
  };
}
