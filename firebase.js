import admin from "firebase-admin";
if(!admin.apps.length){
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.APP_BUCKET || process.env.FIREBASE_STORAGE_BUCKET
  });
}
const db = admin.firestore();
const bucket = admin.storage().bucket();
export { admin, db, bucket };
