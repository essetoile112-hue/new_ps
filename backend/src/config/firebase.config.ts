// Import firebase-admin dynamically so backend remains optional in environments where it's not installed
// Add declarations so editors without Node types installed don't show errors
declare var require: any;
declare const process: any;
// (useful for developers focusing on frontend only).
let admin: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  admin = require('firebase-admin');
} catch (err) {
  // Not installed — user can run `npm install` in backend to enable admin features
}

// Safe initialization when admin SDK is available.
// Priority: 1) If GOOGLE_APPLICATION_CREDENTIALS or ADC exist, use applicationDefault().
// 2) Else if local `serviceAccountKey.json` exists next to this file, load it with `credential.cert()`.
// 3) Else leave uninitialized so backend can still run in limited mode.
if (admin && !admin.apps.length) {
  console.log('[Firebase] Initializing Firebase Admin SDK...');
  const path = require('path');
  const fs = require('fs');
  const projectIdFromEnv = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const databaseUrlFromEnv = process.env.FIREBASE_DATABASE_URL;

  console.log('[Firebase] Project ID:', projectIdFromEnv);
  console.log('[Firebase] Database URL from env:', databaseUrlFromEnv);

  // If explicit credentials are already provided in the environment, prefer ADC
  const hasADC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  console.log('[Firebase] Has ADC:', hasADC);

  if (hasADC) {
    console.log('[Firebase] Using Application Default Credentials');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectIdFromEnv,
      databaseURL: databaseUrlFromEnv || `https://${projectIdFromEnv}-default-rtdb.firebaseio.com`,
    });
  } else {
    // Look for a local service account file (do NOT commit this file to source control)
    const localKeyPath = path.join(__dirname, '..', '..', 'serviceAccountKey.json');
    console.log('[Firebase] Looking for service account at:', localKeyPath);
    console.log('[Firebase] File exists:', fs.existsSync(localKeyPath));
    
    if (fs.existsSync(localKeyPath)) {
      try {
        console.log('[Firebase] Loading service account key...');
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(localKeyPath);
        const inferredProjectId = serviceAccount.project_id || projectIdFromEnv;
        console.log('[Firebase] Initializing with service account, project:', inferredProjectId);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: inferredProjectId,
          databaseURL: databaseUrlFromEnv || `https://${inferredProjectId}-default-rtdb.firebaseio.com`,
        });
        console.log('[Firebase] ✅ Successfully initialized with service account');
      } catch (err) {
        console.error('[Firebase] Error loading service account:', err);
        // If loading fails, fall back to ADC which will likely error later if absent.
        // Keep process alive — callers should handle missing admin.
        try {
          console.log('[Firebase] Falling back to Application Default Credentials');
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectIdFromEnv,
            databaseURL: databaseUrlFromEnv || `https://${projectIdFromEnv}-default-rtdb.firebaseio.com`,
          });
        } catch (e) {
          // final fallback: do nothing
          console.error('[Firebase] ❌ All initialization methods failed');
        }
      }
    } else {
      // No local key — try ADC as a last resort (may still throw if not available)
      console.log('[Firebase] No service account file, trying ADC...');
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectIdFromEnv,
          databaseURL: databaseUrlFromEnv || `https://${projectIdFromEnv}-default-rtdb.firebaseio.com`,
        });
        console.log('[Firebase] ✅ Successfully initialized with ADC');
      } catch (e) {
        // Leave admin uninitialized
        console.error('[Firebase] ❌ ADC initialization failed:', e);
      }
    }
  }
} else if (admin && admin.apps.length) {
  console.log('[Firebase] ✅ Firebase already initialized');
} else {
  console.error('[Firebase] ❌ Firebase Admin SDK not available');
}

export const adminApp: any = admin || null;
export const db: any = admin && admin.apps.length ? admin.firestore() : null;
export const auth: any = admin && admin.apps.length ? admin.auth() : null;

export default adminApp;
