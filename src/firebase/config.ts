'use client';

/**
 * Konfiguration — lokal-first.
 * Keine Firebase/Google-Konfiguration mehr. Alle Daten bleiben lokal im Browser.
 */
export const firebaseConfig = {
  /** Lokaler Modus. Kein externer Dienst, kein Cloud-Speicher. */
  local: true,
} as const;
