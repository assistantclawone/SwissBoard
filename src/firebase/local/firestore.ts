'use client';

/**
 * Firestore-kompatible API auf Basis von localStorage.
 *
 * Stellt genau die Funktionen/Objekte bereit, die die bestehenden UI-Komponenten
 * von SwissBoard verwenden (collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
 * serverTimestamp, Timestamp, onSnapshot), damit die Komponenten UNVERÄNDERT
 * weiterfunktionieren — aber ohne jede Firebase/Cloud-Abhängigkeit.
 */

import { loadDb, saveDb, now, getPath, setPath, deletePath, LocalTimestamp } from './db';

// ---------------------------------------------------------------------------
// Kompatible Ref-Objekte
// ---------------------------------------------------------------------------

export type LocalRef = LocalDocumentRef | LocalCollectionRef;

export interface LocalCollectionRef {
  readonly type: 'collection';
  readonly path: string;
  __memo?: boolean;
}

export interface LocalDocumentRef {
  readonly type: 'document';
  readonly path: string;
  readonly id: string;
  readonly parent: LocalCollectionRef;
  __memo?: boolean;
}

export const localFirestore = {
  /** Marker, dass dies unser lokales "Firestore" ist (kein echtes Firebase). */
  __local: true,
};

export type LocalFirestore = typeof localFirestore;

// ---------------------------------------------------------------------------
// collection() / doc()
// ---------------------------------------------------------------------------

export function collection(
  firestore: LocalFirestore,
  ...pathSegments: string[]
): LocalCollectionRef {
  const path = pathSegments.join('/');
  return { type: 'collection', path } as LocalCollectionRef;
}

export function doc(
  firestoreOrRef: LocalFirestore | LocalCollectionRef,
  ...pathSegments: string[]
): LocalDocumentRef {
  // `doc(collectionRef)` ohne id-Modus: Firestore erzeugt eine Auto-ID.
  const hasNoMoreSegments = pathSegments.length === 0;
  if (isCollectionRef(firestoreOrRef) && hasNoMoreSegments) {
    const autoId = guid();
    const path = `${firestoreOrRef.path}/${autoId}`;
    return {
      type: 'document',
      path,
      id: autoId,
      parent: firestoreOrRef,
    } as LocalDocumentRef;
  }
  if (isCollectionRef(firestoreOrRef)) {
    const path = `${firestoreOrRef.path}/${pathSegments.join('/')}`;
    const parts = path.split('/');
    const id = parts[parts.length - 1];
    return { type: 'document', path, id, parent: firestoreOrRef } as LocalDocumentRef;
  }
  const path = pathSegments.join('/');
  const parts = path.split('/');
  const id = parts[parts.length - 1];
  const parentPath = parts.slice(0, -1).join('/');
  return {
    type: 'document',
    path,
    id,
    parent: { type: 'collection', path: parentPath } as LocalCollectionRef,
  } as LocalDocumentRef;
}

export function isCollectionRef(x: any): x is LocalCollectionRef {
  return !!x && x.type === 'collection';
}

export function isDocumentRef(x: any): x is LocalDocumentRef {
  return !!x && x.type === 'document';
}

// ---------------------------------------------------------------------------
// serverTimestamp() / Timestamp
// ---------------------------------------------------------------------------

class TimestampImpl {
  readonly __localTimestamp: true;
  readonly seconds: number;
  readonly nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.__localTimestamp = true;
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  toDate(): Date {
    return new Date(this.seconds * 1000 + this.nanoseconds / 1e6);
  }
  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }
  static fromDate(date: Date): TimestampImpl {
    return new TimestampImpl(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1e6);
  }
  static now(): TimestampImpl {
    return TimestampImpl.fromDate(new Date());
  }
}

export const Timestamp = TimestampImpl;

export function serverTimestamp(): LocalTimestamp {
  return now();
}

/** Converts a stored timestamp (or serverTimestamp sentinel) into a JS Date. */
export function toJsDate(t: any): Date | null {
  if (!t) return null;
  if (typeof t === 'object' && 'toDate' in t && typeof t.toDate === 'function') {
    return t.toDate();
  }
  if (typeof t === 'object' && 'seconds' in t && typeof t.seconds === 'number') {
    return new Date(t.seconds * 1000);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Schreiboperationen
// ---------------------------------------------------------------------------

function guid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function addDoc(ref: LocalCollectionRef, data: any): Promise<LocalDocumentRef> {
  const db = loadDb();
  const id = guid();
  const docPath = `${ref.path}/${id}`;
  setPath(db, docPath, { ...data });
  saveDb(db);
  notifyLocalChange();
  return {
    type: 'document',
    path: docPath,
    id,
    parent: ref,
  } as LocalDocumentRef;
}

export async function setDoc(ref: LocalDocumentRef, data: any): Promise<void> {
  const db = loadDb();
  setPath(db, ref.path, { ...data });
  saveDb(db);
  notifyLocalChange();
}

export async function updateDoc(ref: LocalDocumentRef, data: any): Promise<void> {
  const db = loadDb();
  const existing = getPath<Record<string, any>>(db, ref.path) || {};
  setPath(db, ref.path, { ...existing, ...data });
  saveDb(db);
  notifyLocalChange();
}

export async function deleteDoc(ref: LocalDocumentRef): Promise<void> {
  const db = loadDb();
  deletePath(db, ref.path);
  saveDb(db);
  notifyLocalChange();
}

// ---------------------------------------------------------------------------
// onSnapshot (minimal, für Kompatibilität mit unserem eigenen Hook)
// ---------------------------------------------------------------------------

export function onSnapshot(
  ref: LocalCollectionRef | LocalDocumentRef,
  onNext: any,
  onError?: (err: any) => void
): () => void {
  // Synchron den aktuellen Wert liefern. Echte Live-Updates übernimmt unser
  // lokal implementierter Hook (siehe use-collection / use-doc), der über
  // einen einfachen Change-Listener auf lokale Writes reagiert.
  try {
    onNext({
      docs: [],
      id: isDocumentRef(ref) ? ref.id : undefined,
    });
  } catch (e) {
    if (onError) onError(e);
  }
  return () => {};
}

/** Low-level change notification helper for the local store (event emitter). */
type ChangeListener = () => void;
const changeListeners = new Set<ChangeListener>();

export function subscribeToLocalChanges(listener: ChangeListener): () => void {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
}

export function notifyLocalChange(): void {
  changeListeners.forEach((l) => l());
}


