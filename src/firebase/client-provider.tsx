'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { localFirestore } from '@/firebase/local/firestore';
import { localAuth } from '@/firebase/local/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Stellt die lokale, datenschutzkonforme Infrastruktur bereit.
 * Kein Firebase, kein Server — alles läuft im Browser (localStorage).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const services = useMemo(() => {
    return {
      firestore: localFirestore,
      auth: localAuth,
    };
  }, []);

  return (
    <FirebaseProvider
      firebaseApp={undefined as any}
      auth={services.auth}
      firestore={services.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
