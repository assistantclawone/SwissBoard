'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocalCollectionRef } from '@/firebase/local/firestore';
import { loadDb, getPath, StoredWall, StoredContent } from '@/firebase/local/db';
import { subscribeToLocalChanges } from '@/firebase/local/firestore';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Lokale, datenschutzkonforme Sammel-Subscription.
 * Stellt die gleiche Oberfläche wie der frühere useCollection-Firestore-Hook bereit,
 * liest aber aus localStorage und reagiert auf lokale Änderungen.
 */
export function useCollection<T = any>(
  memoizedTargetRefOrQuery: LocalCollectionRef | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const readCollection = useCallback((ref: LocalCollectionRef): ResultItemType[] => {
    const db = loadDb();
    const col = getPath<Record<string, any>>(db, ref.path);
    const results: ResultItemType[] = [];
    if (col && typeof col === 'object') {
      for (const [id, value] of Object.entries(col)) {
        if (value && typeof value === 'object') {
          results.push({ ...(value as T), id });
        }
      }
    }
    return results;
  }, []);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const apply = () => {
      try {
        const rows = readCollection(memoizedTargetRefOrQuery);
        setData(rows);
        setError(null);
        setIsLoading(false);
      } catch (e: any) {
        setError(e);
        setData(null);
        setIsLoading(false);
      }
    };

    apply();
    const unsubscribe = subscribeToLocalChanges(apply);
    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery, readCollection]);

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}

// Type helper re-exports, damit Aufrufer diese Typen weiterverwenden können.
export type { StoredWall, StoredContent };
