/**
 * Native IndexedDB Storage Engine for PressCraft Projects
 * Handles high-resolution base64 images and complete layout serialization
 * without browser LocalStorage quota limitations.
 */

import { SavedProject, EditorState } from '@/types/project';

const DB_NAME = 'PressCraftDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB database.'));
    };
  });
}

/**
 * Retrieve all saved projects, sorted by most recently updated first
 */
export async function getAllProjects(): Promise<SavedProject[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const results: SavedProject[] = request.result || [];
      // Sort newest first
      results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(results);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to fetch projects from IndexedDB.'));
    };
  });
}

/**
 * Retrieve a single project by ID
 */
export async function getProjectById(id: string): Promise<SavedProject | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to fetch project ${id}`));
    };
  });
}

/**
 * Save or update a project in IndexedDB
 */
export async function saveProject(project: SavedProject): Promise<SavedProject> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(project);

    request.onsuccess = () => {
      resolve(project);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to save project ${project.name}`));
    };
  });
}

/**
 * Delete a project from IndexedDB by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to delete project ${id}`));
    };
  });
}

/**
 * Duplicate a project with a new ID and updated title
 */
export async function duplicateProject(id: string, newName?: string): Promise<SavedProject> {
  const original = await getProjectById(id);
  if (!original) {
    throw new Error('Original project not found to duplicate.');
  }

  const now = new Date().toISOString();
  const clonedState: EditorState = JSON.parse(JSON.stringify(original.stateData));
  const duplicatedProject: SavedProject = {
    ...original,
    id: 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: newName || `${original.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    stateData: clonedState
  };

  return saveProject(duplicatedProject);
}

/**
 * Clear all projects (utility/reset)
 */
export async function clearAllProjects(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
