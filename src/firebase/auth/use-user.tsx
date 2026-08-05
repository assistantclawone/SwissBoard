'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Auth is not available on initial server render.
      // It becomes available on the client after Firebase is initialized.
      // We'll set loading to false here, but the user will be null.
      // The effect will re-run on the client when auth is available.
      if (typeof window === 'undefined') {
        setLoading(false);
      }
      return;
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
