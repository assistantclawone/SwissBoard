'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalDocumentRef } from '@/firebase/local/firestore';
import { loadDb, getPath } from '@/firebase/local/db';
import { subscribeToLocalChanges } from '@/firebase/local/firestore';

export type { WithId } from './use-collection';
import type { WithId } from './use-collection';

export interface UseDocResult<T> {
  data: WithId<T> | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Lokale, datenschutzkonforme Einzel-Dokument-Subscription (localStorage).
 * Gleiche Oberfläche wie der frühere useDoc-Firestore-Hook.
 */
export function useDoc<T = any>(
  memoizedDocRef: LocalDocumentRef | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const readDoc = useCallback((ref: LocalDocumentRef): StateDataType => {
    const db = loadDb();
    const value = getPath<any>(db, ref.path);
    if (value && typeof value === 'object') {
      return { ...(value as T), id: ref.id };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const apply = () => {
      try {
        setData(readDoc(memoizedDocRef));
        setError(null);
        setIsLoading(false);
      } catch (e: any) {
        setError(e);
        setIsLoading(false);
      }
    };

    apply();
    const unsubscribe = subscribeToLocalChanges(apply);
    return () => unsubscribe();
  }, [memoizedDocRef, readDoc]);

  return { data, isLoading, error };
}
