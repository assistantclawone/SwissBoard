'use client';

/**
 * Lokale, datenschutzkonforme "Auth"-Ersetzung.
 *
 * SwissBoard läuft lokal-first ohne externen Auth-Dienst. Statt eines echten
 * Logins wird automatisch ein lokaler Demo-Benutzer erzeugt, dessen Daten nur
 * im Browser (localStorage) liegen. Keine Daten werden an einen Server gesendet.
 */

import { LocalUser } from './types';
import { loadDb, saveDb, now, type LocalTimestamp } from './db';

export const DEMO_USER_ID = 'demo-lokal';

/** Ein Firebase-Auth-kompatibles Fake-Auth-Objekt für die Provider-Schicht. */
export const localAuth = {
  __local: true,
  currentUser: null as LocalUser | null,
};

export type LocalAuth = typeof localAuth;
export interface LocalAuthState {
  user: LocalUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

/**
 * Gibt den aktuellen lokalen Demo-Benutzer zurück und legt ihn bei Bedarf an
 * (in localStorage unter Key 'swissboard:user'). Der Benutzer ist stabil.
 */
export function getOrCreateLocalUser(): LocalUser {
  const KEY = 'swissboard:user';
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalUser;
        localAuth.currentUser = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('SwissBoard: Could not read local user.', e);
    }
  }

  const user: LocalUser = {
    uid: DEMO_USER_ID,
    email: 'demo@swissboard.local',
    displayName: 'Demo-Lokal',
    emailVerified: false,
    isAnonymous: false,
    photoURL: null,
    providerData: [],
    tenantId: null,
    phoneNumber: null,
    createdAt: now(),
  };
  localAuth.currentUser = user;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('SwissBoard: Could not persist local user.', e);
    }
  }

  // Ensure a user document exists in the local store (creates the account).
  const db = loadDb();
  const existing = db.users[user.uid];
  if (!existing) {
    db.users[user.uid] = {
      email: user.email,
      name: user.displayName,
      createdAt: now(),
      walls: {},
    };
    saveDb(db);
  }

  return user;
}

/** Stellt sicher, dass die Demo-Session pro Laufzeit aktiv ist. */
export function ensureLocalUser(): LocalUser {
  return getOrCreateLocalUser();
}

function toJsTime(t: LocalTimestamp | undefined): Date {
  if (!t) return new Date();
  return new Date(t.seconds * 1000);
}

/** simuliert signOut: setzt den Benutzer zurück (nur lokal). */
export function clearLocalUser(): void {
  localAuth.currentUser = null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('swissboard:user');
    } catch (e) {
      /* ignore */
    }
  }
}
