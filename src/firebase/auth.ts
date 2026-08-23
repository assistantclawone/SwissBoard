'use client';

/**
 * Lokale Auth-Operationen (Firebase-kompatible Signatur, aber ohne Firebase).
 *
 * SwissBoard läuft lokal-first: Es gibt kein echtes Konto-System. Stattdessen wird
 * ein lokaler Demo-Benutzer verwendet. Anmelden/Registrieren geben daher den lokalen
 * Demo-Benutzer zurück; Abmelden setzt die lokale Session zurück. Nichts verlässt den
 * Browser.
 */

import { LocalAuth, ensureLocalUser, clearLocalUser } from './local/auth';
import { LocalUser } from './local/types';

export function getErrorMessage(error: any): string {
  return 'Ein lokaler Fehler ist aufgetreten. Bitte versuchen Sie es erneut.';
}

export async function signUp(
  auth: LocalAuth,
  _firestore: any,
  _email: string,
  _password: string
): Promise<{ user?: LocalUser; error?: string }> {
  const localUser = ensureLocalUser();
  return { user: localUser };
}

export async function signIn(
  _auth: LocalAuth,
  _email: string,
  _password: string
): Promise<{ user?: LocalUser; error?: string }> {
  const localUser = ensureLocalUser();
  return { user: localUser };
}

export async function signOutUser(_auth: LocalAuth): Promise<{ error?: string }> {
  clearLocalUser();
  return {};
}
