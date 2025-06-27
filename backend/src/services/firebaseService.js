const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let db = null;
let auth = null;

try {
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  logger.info('Firebase Admin SDK initialized successfully.');
  db = admin.firestore();
  auth = admin.auth();
} catch (error) {
  logger.warn('Firebase Admin SDK not initialized - authentication will be disabled:', {
    message: error.message,
  });
  // Don't exit the process, just log a warning
}

module.exports = { db, auth }; 