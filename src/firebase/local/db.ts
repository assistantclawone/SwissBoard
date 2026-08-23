'use client';

/**
 * Local, datenschutzkonforme Datenbank-Shim.
 *
 * Ersetzt Firestore durch eine reine localStorage-basierte Ablage. Nichts verlässt
 * den Browser — kein Server, keine Cloud. Die Daten liegen ausschliesslich auf dem
 * Gerät des Nutzers (Schweizer Datenschutz: keine US-Server).
 *
 * Schema:
 *   { users: { [uid]: { walls: { [wallId]: { ...wall, content: { [postId]: {...} } } } } } }
 */

const DB_KEY = 'swissboard:db:v1';

export type StoredDb = {
  users: Record<string, StoredUser>;
};

export type StoredUser = {
  email?: string;
  name?: string;
  createdAt?: LocalTimestamp;
  walls: Record<string, StoredWall>;
};

export type StoredWall = {
  ownerId: string;
  title: string;
  description?: string;
  createdAt?: LocalTimestamp;
  privacySetting: 'public' | 'private';
  members?: Record<string, 'viewer' | 'editor'>;
  content: Record<string, StoredContent>;
};

export type StoredContent = {
  wallId: string;
  authorId: string;
  type: 'text' | 'image' | 'link';
  data: string;
  position: { x: number; y: number };
  createdAt?: LocalTimestamp;
  updatedAt?: LocalTimestamp;
};

/** A plain serialisable stand-in for Firestore's serverTimestamp(). */
export type LocalTimestamp = { __localTimestamp: true; seconds: number };

function emptyDb(): StoredDb {
  return { users: {} };
}

export function loadDb(): StoredDb {
  if (typeof window === 'undefined') return emptyDb();
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.users) return parsed as StoredDb;
    return emptyDb();
  } catch (e) {
    console.warn('SwissBoard: Could not read local database, starting fresh.', e);
    return emptyDb();
  }
}

export function saveDb(db: StoredDb): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('SwissBoard: Could not save local database (maybe storage full).', e);
  }
}

export function now(): LocalTimestamp {
  return { __localTimestamp: true, seconds: Math.floor(Date.now() / 1000) };
}

/** Splits a firestore-style path like "users/uid/walls" into segments. */
export function pathToSegments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/**
 * Navigiert zur übergeordneten Ebene eines Pfads und legt fehlende Container
 * (collection-Maps und doc-Objekte) an. Gibt das Eltern-Objekt zurück, in das
 * der letzte Segment-Key geschrieben/gelöscht werden kann.
 */
function navigateToParent(db: StoredDb, segments: string[]): any {
  // Virtuelle Wurzel: segments[0] ist üblicherweise 'users'.
  const root: any = { users: db.users };
  let node: any = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (node === null || typeof node !== 'object') {
      // Nicht-objekt an dieser Stelle — überschreiben mit Container.
      node = {};
    }
    if (typeof node[seg] === 'undefined' || node[seg] === null) {
      node[seg] = {};
    }
    node = node[seg];
  }
  return node;
}

/** Returns the leaf value at a path (a map / owner object / value). */
export function getPath<T>(db: StoredDb, path: string): T | null {
  const segments = pathToSegments(path);
  if (segments.length === 0) return null;
  let node: any = { users: db.users };
  for (const seg of segments) {
    if (node === null || typeof node !== 'object') return null;
    node = node[seg];
  }
  return node === undefined || node === null ? null : (node as T);
}

/** Sets a value at the given path, creating missing owners along the way. */
export function setPath(db: StoredDb, path: string, value: any): void {
  const segments = pathToSegments(path);
  if (segments.length === 0) return;
  const parent = navigateToParent(db, segments);
  parent[segments[segments.length - 1]] = value;
}

/** Deletes the value at a path. */
export function deletePath(db: StoredDb, path: string): void {
  const segments = pathToSegments(path);
  if (segments.length === 0) return;
  if (segments.length === 1 && segments[0] === 'users') {
    db.users = {};
    return;
  }
  const parent = navigateToParent(db, segments);
  delete parent[segments[segments.length - 1]];
}

export const DB_KEY_NAME = DB_KEY;
