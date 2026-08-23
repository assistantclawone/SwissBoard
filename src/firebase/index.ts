'use client';

/**
 * Firebase-Abstraktion — jetzt lokal-first und datenschutzkonform.
 *
 * Diese Datei behält die exakt gleiche Export-Oberfläche wie zuvor, damit alle
 * bestehenden Komponenten (Dashboard, Wand-Seite, WallCard, ContentCard, Header,
 * Login, Register) UNVERÄNDERT weiterfunktionieren. Unter der Haube wird echter
 * Firebase/Cloud-Zugriff durch eine reine localStorage-Variante ersetzt.
 */

// Lokale Datenbank + Firestore-kompatible API
export {
  localFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  subscribeToLocalChanges,
  isCollectionRef,
  isDocumentRef,
} from './local/firestore';
export type {
  LocalCollectionRef,
  LocalDocumentRef,
  LocalFirestore,
} from './local/firestore';

// Lokale Auth + Demo-Benutzer
export {
  DEMO_USER_ID,
  localAuth,
  ensureLocalUser,
  getOrCreateLocalUser,
  clearLocalUser,
} from './local/auth';
export type { LocalUser } from './local/types';

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
