'use client';

import { useState, useEffect } from 'react';
import { ensureLocalUser } from '@/firebase/local/auth';
import { LocalUser } from '@/firebase/local/types';

/**
 * Lokale useUser-Variante (Firebase-kompatibel).
 * Liefert sofort den lokalen Demo-Benutzer, ohne Server-Roundtrip.
 */
export function useUser() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localUser = ensureLocalUser();
    setUser(localUser);
    setLoading(false);
  }, []);

  return { user, loading };
}
