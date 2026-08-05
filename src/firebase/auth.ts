'use client';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type AuthError,
  type User
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';

function getErrorMessage(error: any): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const authError = error as AuthError;
        console.error("Firebase Auth Error:", authError);
        switch (authError.code) {
            case 'auth/invalid-email':
                return 'Die E-Mail-Adresse ist ungültig.';
            case 'auth/user-disabled':
                return 'Dieses Benutzerkonto wurde deaktiviert.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return 'Falsche E-Mail-Adresse oder falsches Passwort.';
            case 'auth/email-already-in-use':
                return 'Diese E-Mail-Adresse wird bereits verwendet.';
            case 'auth/weak-password':
                return 'Das Passwort ist zu schwach. Es muss mindestens 6 Zeichen lang sein.';
            case 'auth/operation-not-allowed':
            case 'auth/configuration-not-found':
                return 'Die E-Mail/Passwort-Anmeldung ist in der Firebase-Konsole nicht aktiviert. Bitte aktivieren Sie sie.';
            default:
                return `Ein unbekannter Fehler ist aufgetreten (${authError.code}). Bitte versuchen Sie es erneut.`;
        }
    }
    console.error("Unexpected registration error:", error);
    return 'Ein unerwarteter Konfigurationsfehler ist aufgetreten. Stellen Sie sicher, dass die Firebase-Konfiguration korrekt ist.';
}

export async function signUp(auth: Auth, firestore: Firestore, email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        createdAt: serverTimestamp(),
    });

    return { user };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function signIn(auth: Auth, email: string, password: string): Promise<{ user?: User; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function signOutUser(auth: Auth): Promise<{ error?: string }> {
  try {
    await firebaseSignOut(auth);
    return {};
  } catch (error) {
     return { error: getErrorMessage(error) };
  }
}
