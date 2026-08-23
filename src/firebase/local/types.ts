'use client';

/** Lokale, Firebase-kompatible User-Repräsentation (nur die Felder, die SwissBoard nutzt). */
export interface LocalUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL: string | null;
  phoneNumber: string | null;
  tenantId: string | null;
  providerData: Array<{ providerId: string; uid: string }>;
  createdAt?: { __localTimestamp: true; seconds: number };
}
