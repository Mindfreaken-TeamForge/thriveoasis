import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableIndexedDbPersistence,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBRvo1QG1Zq3iFO75cyJLBA2bMvw3tXFKg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "forge-sync.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "forge-sync",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "forge-sync.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "202823382709",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:202823382709:web:d0b08a2a6d71c0553230fc",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://forge-sync-default-rtdb.firebaseio.com"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error:', error);
  }
}

export const auth = getAuth(app);

// Initialize Firestore with enhanced configuration
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);

// Initialize persistence and handle errors
const initializeFirestorePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Firestore persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence disabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by browser');
    } else {
      console.error('Persistence initialization error:', err);
    }
  }
};

// Network state management
export const handleNetworkState = async (online: boolean) => {
  try {
    if (online) {
      await enableNetwork(db);
      console.log('Network connection enabled');
    } else {
      await disableNetwork(db);
      console.log('Network connection disabled');
    }
  } catch (error) {
    console.error('Error managing network state:', error);
  }
};

// Helper function to initialize user data with offline support
export const initializeUserData = async (userId: string, userData: any) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        role: 'member',
        isActive: true
      }, { merge: true });
      console.log('User data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

// Helper function to get user data with proper error handling
export const getUserData = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Initialize persistence
initializeFirestorePersistence().catch(console.error);

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => handleNetworkState(true));
  window.addEventListener('offline', () => handleNetworkState(false));
}

export default app;