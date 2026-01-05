import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from '../config/firebase.config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  country: string;
  phoneNumber: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: Date;
}

/**
 * Créer un nouveau compte utilisateur
 * 1. Crée un compte Firebase Auth
 * 2. Ajoute les infos de l'utilisateur dans Firestore
 * 3. Retourne l'utilisateur créé
 */
export async function registerUser(
  fullName: string,
  country: string,
  phoneNumber: string,
  email: string,
  password: string
): Promise<AuthUser> {
  try {
    console.log('[REGISTER] Starting registration process for email:', email);
    console.log('[REGISTER] Using pure client-side Firebase registration...');

    // 1. Créer l'utilisateur dans Firebase Auth (client-side)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('[REGISTER] Firebase Auth user created, UID:', (firebaseUser as any).uid);

    // 2. Créer le document utilisateur dans Firestore
    //    Les règles Firestore doivent autoriser l'utilisateur connecté à créer son propre document.
    const userData: Omit<AuthUser, 'id' | 'createdAt'> & { createdAt: any } = {
      email,
      fullName,
      country,
      phoneNumber,
      role: 'viewer',
      // On stocke createdAt en date ISO pour rester simple côté Firestore
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', (firebaseUser as any).uid), userData);
    } catch (firestoreError: any) {
      console.error('[REGISTER] Firestore setDoc error:', firestoreError);
      // Si permissions insuffisantes, on nettoie l'utilisateur Auth créé
      await firebaseUser.delete();
      if (firestoreError.message.includes('App Check')) {
        throw new Error('App Check Firestore activé. Désactivez App Check pour Firestore en développement.');
      }
      throw new Error('Permissions Firestore insuffisantes. Vérifiez les règles Firestore et App Check.');
    }
    console.log('[REGISTER] Firestore user document created for UID:', (firebaseUser as any).uid);

    const newUser: AuthUser = {
      id: (firebaseUser as any).uid,
      email,
      fullName,
      country,
      phoneNumber,
      role: 'viewer',
      createdAt: new Date(userData.createdAt),
    };

    console.log('[REGISTER] Registration completed successfully (client-side only)!');
    return newUser;
  } catch (error: any) {
    console.error('[REGISTER] Error during registration:', error);
    const msg = error?.message || String(error);

    if (msg.includes('firebase-app-check-token-is-invalid') || msg.includes('app-check')) {
      throw new Error(
        "Erreur lors de l'inscription: App Check token invalide. Pour le développement, désactivez l'App Check dans la console Firebase ou utilisez un token de debug App Check."
      );
    }

    if (msg.includes('auth/email-already-in-use')) {
      throw new Error(`L'email ${email} est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.`);
    }

    // Message d'erreur générique pour l'utilisateur, sans double préfixe
    throw new Error(`Erreur lors de l'inscription: ${msg}`);
  }
}

/**
 * Connexion utilisateur avec backend verification
 * 1. Authentifie avec Firebase Auth (client-side)
 * 2. Envoie le token Firebase au backend pour vérification
 * 3. Récupère les infos de Firestore
 * 4. Retourne l'utilisateur connecté
 */
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  try {
    console.log('[LOGIN] Starting login process for email:', email);
    
    // Étape 1: Se connecter avec Firebase Auth
    console.log('[LOGIN] Signing in with Firebase Auth...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    console.log('[LOGIN] User signed in successfully, UID:', (firebaseUser as any).uid);

    // Étape 2: Récupérer les infos de Firestore
    console.log('[LOGIN] Fetching user document from Firestore...');
    let userDoc;
    try {
      userDoc = await getDoc(doc(db, 'users', (firebaseUser as any).uid));
    } catch (firestoreError: any) {
      console.error('[LOGIN] Firestore getDoc error:', firestoreError);
      throw new Error('Permissions Firestore insuffisantes pour la lecture. Vérifiez les règles Firestore.');
    }
    console.log('[LOGIN] User document exists:', userDoc.exists());
    if (!userDoc.exists()) {
      console.warn('[LOGIN] User document not found in Firestore. Attempting to create a fallback user document.');

      // Create a minimal user document based on the Auth user info to avoid blocking login flows
      const fallbackData: Omit<AuthUser, 'id' | 'createdAt'> & { createdAt: any } = {
        email: firebaseUser.email || email,
        fullName: (firebaseUser.displayName as string) || '',
        country: '',
        phoneNumber: (firebaseUser.phoneNumber as string) || '',
        role: 'viewer',
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', (firebaseUser as any).uid), fallbackData);
        // re-read the document
        userDoc = await getDoc(doc(db, 'users', (firebaseUser as any).uid));
        console.log('[LOGIN] Fallback user document created for UID:', (firebaseUser as any).uid);
      } catch (firestoreCreateError: any) {
        console.error('[LOGIN] Failed to create fallback user document:', firestoreCreateError);
        throw new Error('Utilisateur trouvé dans Auth mais impossible de créer le document utilisateur en base. Vérifiez les règles Firestore ou contactez l\'administrateur.');
      }
    }

    // Normalize the createdAt field to a JS Date object
    const data = userDoc.data() as any;
    let createdAt = new Date();
    if (data.createdAt) {
      // Firestore may return a Timestamp object or a string
      if (typeof data.createdAt === 'string') {
        createdAt = new Date(data.createdAt);
      } else if (typeof data.createdAt.toDate === 'function') {
        // Firestore Timestamp
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt.seconds) {
        createdAt = new Date(data.createdAt.seconds * 1000);
      }
    }

    const user = {
      ...(data as Omit<AuthUser, 'createdAt'>),
      createdAt,
    } as AuthUser;
    // No profile-completion flag (fallback document created client-side previously)
    
    console.log('[LOGIN] User logged in successfully:', user);
    return user;
  } catch (error: any) {
    console.error('[LOGIN] Login error:', error);
    const msg = error?.message || String(error);
    // Map common Firebase auth errors to friendly French messages
    const code = error?.code || '';
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential') || code.includes('auth/invalid-password')) {
      throw new Error('mot de passe incorrecte');
    }
    if (code.includes('auth/user-not-found') || code.includes('auth/user-disabled')) {
      throw new Error("Utilisateur introuvable ou désactivé.");
    }
    if (msg.includes('firebase-app-check-token-is-invalid') || msg.includes('app-check')) {
      throw new Error('Erreur lors de la connexion: App Check token invalide. Pour le développement, désactivez l\'App Check dans la console Firebase ou utilisez un token de debug App Check.');
    }
    throw new Error(`Erreur lors de la connexion: ${msg}`);
  }
}

/**
 * Déconnexion utilisateur
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`Erreur lors de la déconnexion: ${error.message}`);
  }
}

/**
 * Écouter les changements d'état d'authentification
 * Appelle le callback quand l'utilisateur se connecte/déconnecte
 */
export function onAuthChange(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Utilisateur connecté → récupérer ses infos
      const userDoc = await getDoc(doc(db, 'users', (firebaseUser as any).uid));
      if (userDoc.exists()) {
        const data = userDoc.data() as any;
        let createdAt = new Date();
        if (data.createdAt) {
          if (typeof data.createdAt === 'string') createdAt = new Date(data.createdAt);
          else if (typeof data.createdAt.toDate === 'function') createdAt = data.createdAt.toDate();
          else if (data.createdAt.seconds) createdAt = new Date(data.createdAt.seconds * 1000);
        }

        callback({ ...(data as Omit<AuthUser, 'createdAt'>), createdAt } as AuthUser);
      }
    } else {
      // Utilisateur déconnecté
      callback(null);
    }
  });
}

/**
 * Récupérer l'utilisateur actuel
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;

  const userDoc = await getDoc(doc(db, 'users', (firebaseUser as any).uid));
  if (!userDoc.exists()) return null;

  const data = userDoc.data() as any;
  let createdAt = new Date();
  if (data.createdAt) {
    if (typeof data.createdAt === 'string') createdAt = new Date(data.createdAt);
    else if (typeof data.createdAt.toDate === 'function') createdAt = data.createdAt.toDate();
    else if (data.createdAt.seconds) createdAt = new Date(data.createdAt.seconds * 1000);
  }

  return { ...(data as Omit<AuthUser, 'createdAt'>), createdAt } as AuthUser;
}

/**
 * Récupérer un JWT token pour les appels API
 */
export async function getAuthToken(): Promise<string | null> {
  return auth.currentUser?.getIdToken() ?? null;
}
