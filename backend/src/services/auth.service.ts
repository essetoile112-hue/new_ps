import { db, auth } from '../config/firebase.config';

export interface RegisterParams {
  fullName: string;
  country: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export async function createUserWithEmail(params: RegisterParams) {
  if (!auth || !db) throw new Error('Firebase Admin not initialized');

  console.log('[BACKEND-REGISTER] Starting registration for:', params.email);

  // Check if user with this email already exists
  try {
    console.log('[BACKEND-REGISTER] Checking if email exists:', params.email);
    await auth.getUserByEmail(params.email);
    // If we reach here, user exists
    console.log('[BACKEND-REGISTER] Email already exists:', params.email);
    throw new Error(`Un compte avec l'email ${params.email} existe déjà. Veuillez vous connecter.`);
  } catch (err: any) {
    // The Admin SDK may return different message texts across versions.
    // Detect the "user not found" case by error code or by common message fragments.
    const isUserNotFound = err && (err.code === 'auth/user-not-found' || (err.message && (err.message.includes('No user record') || err.message.includes('There is no user record'))));
    if (!isUserNotFound) {
      // This is a different error, re-throw it
      console.log('[BACKEND-REGISTER] Email check error:', err && err.message ? err.message : err);
      throw err;
    }
    // Email is available, continue with registration
    console.log('[BACKEND-REGISTER] Email is available, proceeding with registration');
  }

  console.log('[BACKEND-REGISTER] Creating user in Firebase Auth:', params.email);
  const userRecord = await auth.createUser({
    email: params.email,
    password: params.password,
    displayName: params.fullName,
  });
  console.log('[BACKEND-REGISTER] User created with UID:', userRecord.uid);

  const role = 'viewer';
  console.log('[BACKEND-REGISTER] Saving user to Firestore:', userRecord.uid);
  await db.collection('users').doc(userRecord.uid).set({
    id: userRecord.uid,
    email: params.email,
    fullName: params.fullName,
    country: params.country,
    phoneNumber: params.phoneNumber,
    role,
    createdAt: new Date(),
  });
  console.log('[BACKEND-REGISTER] User saved to Firestore successfully');

  // Set custom claims (roles)
  console.log('[BACKEND-REGISTER] Setting custom claims');
  await auth.setCustomUserClaims(userRecord.uid, { role });
  console.log('[BACKEND-REGISTER] Registration completed successfully!');

  // Return minimal user info; frontend will handle auth
  return { id: userRecord.uid, email: params.email, fullName: params.fullName, role };
}

export async function verifyIdToken(idToken: string) {
  if (!auth) throw new Error('Firebase Admin not initialized');
  return auth.verifyIdToken(idToken);
}

export async function getUserByUid(uid: string) {
  if (!db) throw new Error('Firebase Admin not initialized');
  const doc = await db.collection('users').doc(uid).get();
  if (!doc.exists) throw new Error('User profile not found');
  const data = doc.data();
  return data;
}

// Google idToken flow: verify via google OAuth and exchange to Firebase custom token
import { OAuth2Client } from 'google-auth-library';

export async function createCustomTokenForGoogle(googleIdToken: string) {
  // NOTE: This function used to accept a Google OAuth id_token and verify using google-auth-library.
  // However, the frontend sends a Firebase ID token after signInWithPopup, which should be verified
  // using the Admin SDK. To simplify and avoid mismatches, accept a Firebase ID token and
  // verify it via `auth.verifyIdToken`.
  if (!auth || !db) throw new Error('Firebase Admin not initialized');
  // Treat the input as a Firebase ID token
  const decoded = await auth.verifyIdToken(googleIdToken as string);
  if (!decoded || !decoded.uid) throw new Error('Invalid Firebase ID token');

  // Ensure user record exists in Admin SDK
  let userRecord;
  try {
    userRecord = await auth.getUser(decoded.uid);
  } catch (err) {
    // Unable to find user by UID; try by email
    if (decoded.email) {
      try {
        userRecord = await auth.getUserByEmail(decoded.email);
      } catch (e) {
        // Create user if it doesn't exist
        userRecord = await auth.createUser({
          uid: decoded.uid,
          email: decoded.email,
          displayName: decoded.name || undefined,
          photoURL: decoded.picture || undefined,
          emailVerified: true,
        });
      }
    } else {
      throw new Error('Decoded token does not contain email');
    }
  }

  // Ensure Firestore user doc exists
  const userDoc = await db.collection('users').doc(userRecord.uid).get();
  if (!userDoc.exists) {
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: userRecord.email,
      fullName: userRecord.displayName || '',
      role: 'viewer',
      createdAt: new Date(),
    });
  }

  return { id: userRecord.uid, email: userRecord.email || '', fullName: userRecord.displayName || '', role: 'viewer' };
}
