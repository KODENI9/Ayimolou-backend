import dotenv from 'dotenv';
import * as admin from 'firebase-admin';

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (serviceAccountPath) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not found in .env');
}

export const db = admin.firestore();
export const auth = admin.auth();

export default admin;
