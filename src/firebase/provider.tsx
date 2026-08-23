'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import {
  localFirestore,
  LocalFirestore,
} from './local/firestore';
import { LocalUser } from './local/types';
import { ensureLocalUser, LocalAuth } from './local/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  auth: LocalAuth;
  firestore: LocalFirestore;
}

// Internal state for user authentication
interface UserAuthState {
  user: LocalUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: null; // kein echtes Firebase-App-Objekt (lokal-first)
  firestore: LocalFirestore | null;
  auth: LocalAuth | null;
  user: LocalUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: null;
  firestore: LocalFirestore;
  auth: LocalAuth;
  user: LocalUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: LocalUser | null;
  isUserLoading: boolean;
  /** Alias für isUserLoading — wird von bestehenden Komponenten genutzt. */
  loading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children, auth, firestore }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  // Lokal: Der Demo-Benutzer wird sofort (synchron) erzeugt und angemeldet.
  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error('Auth service not provided.') });
      return;
    }
    try {
      const localUser = ensureLocalUser();
      setUserAuthState({ user: localUser, isUserLoading: false, userError: null });
    } catch (e: any) {
      console.error('local auth error:', e);
      setUserAuthState({ user: null, isUserLoading: false, userError: e });
    }
  }, [auth]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!firestore && !!auth;
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  if (!context.areServicesAvailable || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }
  return {
    firebaseApp: null,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): LocalAuth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): LocalFirestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): null => {
  return null;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, loading: isUserLoading, isUserLoading, userError };
};
