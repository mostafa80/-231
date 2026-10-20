import { Session, ReturnItem } from '../types';

const LOCAL_SESSIONS_KEY = 'jard_multi_returns_hub_v2';
const LOCAL_MASTER_KEY = 'jard_master_catalog_v2';
const DB_NAME = 'JardOfflinePersistenceDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

export interface PersistedAppState {
  timestamp: number;
  activeSessionId: string | null;
  sessions: Session[];
  masterCatalog?: Record<string, ReturnItem>;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves both sessions (invoice + received counts) and masterCatalog immediately
 * to LocalStorage (for synchronous instant recovery) and IndexedDB (for large catalogs & power-loss protection).
 */
export async function saveAppStateOffline(state: {
  sessions: Session[];
  activeSessionId: string | null;
  masterCatalog: Record<string, ReturnItem>;
}): Promise<boolean> {
  const timestamp = Date.now();

  // 1. Synchronous LocalStorage save for sessions (instant protection before power loss)
  try {
    if (state.sessions.length > 0) {
      const sessionPayload = {
        timestamp,
        activeSessionId: state.activeSessionId,
        sessions: state.sessions,
      };
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessionPayload));
    }
  } catch {
    // Quota exceeded in localStorage; IndexedDB will handle it below
  }

  // Try saving masterCatalog to localStorage if it fits
  try {
    if (Object.keys(state.masterCatalog).length > 0) {
      localStorage.setItem(LOCAL_MASTER_KEY, JSON.stringify(state.masterCatalog));
    } else {
      localStorage.removeItem(LOCAL_MASTER_KEY);
    }
  } catch {
    // Master catalog might be >5MB; IndexedDB below handles unlimited size
  }

  // 2. IndexedDB full state save (unlimited offline capacity for Master + Invoices + Counts)
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(
        {
          timestamp,
          activeSessionId: state.activeSessionId,
          sessions: state.sessions,
          masterCatalog: state.masterCatalog,
        } satisfies PersistedAppState,
        'latest'
      );
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Synchronously reads LocalStorage fallback for immediate initial render.
 */
export function loadSyncFallbackState(): {
  sessions: Session[] | null;
  activeSessionId: string | null;
  masterCatalog: Record<string, ReturnItem> | null;
  timestamp: number | null;
} {
  let sessions: Session[] | null = null;
  let activeSessionId: string | null = null;
  let timestamp: number | null = null;
  let masterCatalog: Record<string, ReturnItem> | null = null;

  try {
    const rawSessions = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (rawSessions) {
      const parsed = JSON.parse(rawSessions);
      if (parsed?.sessions && Array.isArray(parsed.sessions) && parsed.sessions.length > 0) {
        sessions = parsed.sessions;
        activeSessionId = parsed.activeSessionId || parsed.sessions[0].id;
        timestamp = parsed.timestamp || Date.now();
      }
    }
  } catch {
    // ignore
  }

  try {
    const rawMaster = localStorage.getItem(LOCAL_MASTER_KEY);
    if (rawMaster) {
      const parsedMaster = JSON.parse(rawMaster);
      if (parsedMaster && typeof parsedMaster === 'object') {
        masterCatalog = parsedMaster;
      }
    }
  } catch {
    // ignore
  }

  return { sessions, activeSessionId, masterCatalog, timestamp };
}

/**
 * Loads full state from IndexedDB (and compares timestamp with LocalStorage so the newest state always wins).
 */
export async function loadAppStateOffline(): Promise<PersistedAppState | null> {
  const syncState = loadSyncFallbackState();

  try {
    const db = await openDatabase();
    const idbData = await new Promise<PersistedAppState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('latest');
      req.onsuccess = () => {
        db.close();
        resolve(req.result as PersistedAppState | undefined);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });

    if (idbData && idbData.sessions && idbData.sessions.length > 0) {
      // If localStorage has a newer timestamp (e.g. from synchronous beforeunload), merge its sessions with idb masterCatalog
      if (syncState.timestamp && syncState.sessions && syncState.timestamp > (idbData.timestamp || 0)) {
        return {
          timestamp: syncState.timestamp,
          activeSessionId: syncState.activeSessionId,
          sessions: syncState.sessions,
          masterCatalog: syncState.masterCatalog || idbData.masterCatalog || {},
        };
      }
      return {
        timestamp: idbData.timestamp || Date.now(),
        activeSessionId: idbData.activeSessionId || idbData.sessions[0].id,
        sessions: idbData.sessions,
        masterCatalog: idbData.masterCatalog || syncState.masterCatalog || {},
      };
    }
  } catch {
    // Fallback to syncState if IndexedDB fails
  }

  if (syncState.sessions && syncState.sessions.length > 0) {
    return {
      timestamp: syncState.timestamp || Date.now(),
      activeSessionId: syncState.activeSessionId || syncState.sessions[0].id,
      sessions: syncState.sessions,
      masterCatalog: syncState.masterCatalog || {},
    };
  }

  return null;
}

/**
 * Clears saved offline data when explicitly starting a fresh empty session from scratch.
 */
export async function clearOfflineStorage(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_SESSIONS_KEY);
    localStorage.removeItem(LOCAL_MASTER_KEY);
  } catch {
    // ignore
  }
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete('latest');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
}
