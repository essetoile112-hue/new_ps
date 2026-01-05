// Script to list recent users from Firebase Auth and recent docs from Firestore
// Usage: node scripts/check_firebase.js

const path = require('path');

try {
  const admin = require('firebase-admin');
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'u4-green-africa',
  });

  const auth = admin.auth();
  const db = admin.firestore();

  async function run() {
    console.log('\n== Firebase Auth: Recent users (pageSize 20) ==');
    try {
      const list = await auth.listUsers(20);
      list.users.forEach((u) => {
        console.log(`- uid: ${u.uid}, email: ${u.email}, displayName: ${u.displayName || ''}, disabled: ${u.disabled}`);
      });
      if (!list.users.length) console.log('(no users returned)');
    } catch (err) {
      console.error('Error listing users:', err.message || err);
    }

    console.log('\n== Firestore: Recent documents in `users` collection (limit 20) ==');
    try {
      const snapshot = await db.collection('users').orderBy('createdAt', 'desc').limit(20).get();
      if (snapshot.empty) {
        console.log('(no user documents found)');
      } else {
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`- doc id: ${doc.id}, email: ${data.email || ''}, fullName: ${data.fullName || ''}, createdAt: ${data.createdAt}`);
        });
      }
    } catch (err) {
      console.error('Error querying Firestore users collection:', err.message || err);
    }

    process.exit(0);
  }

  run();
} catch (err) {
  console.error('Fatal error: could not run script -', err.message || err);
  process.exit(1);
}
