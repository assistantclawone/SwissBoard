'use client';

import { ensureLocalUser } from './local/auth';

/** Lokale, non-blocking "Anmeldung" — erzeugt den Demo-Benutzer. */
export function initiateAnonymousSignIn(_authInstance?: any): void {
  ensureLocalUser();
}

export function initiateEmailSignUp(_authInstance?: any, _email?: string, _password?: string): void {
  ensureLocalUser();
}

export function initiateEmailSignIn(_authInstance?: any, _email?: string, _password?: string): void {
  ensureLocalUser();
}
