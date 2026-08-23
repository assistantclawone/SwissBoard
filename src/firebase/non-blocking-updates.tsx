'use client';

import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  LocalCollectionRef,
  LocalDocumentRef,
} from '@/firebase/local/firestore';

/**
 * Non-blocking-Schreiboperationen (lokal). Führen die Operation aus, ohne auf
 * das Ergebnis zu warten. Da alles lokal (localStorage) ist, kann hier praktisch
 * nichts fehlschlagen — verbleibende Fehler werden geloggt.
 */

export function setDocumentNonBlocking(docRef: LocalDocumentRef, data: any, _options?: any) {
  setDoc(docRef, data).catch((error: any) => {
    console.error('Local setDoc failed:', error);
  });
}

export function addDocumentNonBlocking(colRef: LocalCollectionRef, data: any) {
  return addDoc(colRef, data).catch((error: any) => {
    console.error('Local addDoc failed:', error);
    return undefined;
  });
}

export function updateDocumentNonBlocking(docRef: LocalDocumentRef, data: any) {
  updateDoc(docRef, data).catch((error: any) => {
    console.error('Local updateDoc failed:', error);
  });
}

export function deleteDocumentNonBlocking(docRef: LocalDocumentRef) {
  deleteDoc(docRef).catch((error: any) => {
    console.error('Local deleteDoc failed:', error);
  });
}
