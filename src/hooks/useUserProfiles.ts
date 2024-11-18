import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface UserProfile {
  photoURL?: string;
  displayName?: string;
}

const profileCache: Record<string, UserProfile> = {};
const listeners: Record<string, Set<(profile: UserProfile) => void>> = {};

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(
    userId ? profileCache[userId] || null : null
  );

  useEffect(() => {
    if (!userId) return;

    // Create listener set if it doesn't exist
    if (!listeners[userId]) {
      listeners[userId] = new Set();
      
      // Set up firestore listener only for the first subscriber
      const unsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
        if (doc.exists()) {
          const newProfile = doc.data() as UserProfile;
          profileCache[userId] = newProfile;
          listeners[userId].forEach(callback => callback(newProfile));
        }
      });

      // Clean up listener when last subscriber is removed
      return () => {
        listeners[userId].delete(setProfile);
        if (listeners[userId].size === 0) {
          delete listeners[userId];
          unsubscribe();
        }
      };
    }

    // Add this component's setter to listeners
    listeners[userId].add(setProfile);

    // Return cleanup function
    return () => {
      listeners[userId]?.delete(setProfile);
    };
  }, [userId]);

  return profile;
} 