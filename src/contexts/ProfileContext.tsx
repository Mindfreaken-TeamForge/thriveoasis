import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, writeBatch, getDocs, query, where, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface UserProfile {
  displayName: string;
  photoURL: string;
  role: string;
  // ... other profile fields
}

interface ProfileContextType {
  userProfile: UserProfile | null;
  updateProfileUrl: (url: string) => Promise<void>;
  // ... other methods
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Set up real-time listener for the user's profile
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as UserProfile;
            setUserProfile(userData);
          }
        });

        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []); // Empty dependency array since we want this to run once

  const updateProfileUrl = async (url: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Update user profile in Firebase Auth
      await updateProfile(user, {
        photoURL: url
      });

      // Update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: url,
        lastUpdated: serverTimestamp()
      });

      // Get all oasis where user is a member
      const batch = writeBatch(db);
      
      // First get user's joined oasis
      const joinedOasisRef = collection(db, 'users', user.uid, 'joinedOasis');
      const joinedOasisSnapshot = await getDocs(joinedOasisRef);

      // Then get user's created oasis
      const createdOasisRef = collection(db, 'users', user.uid, 'createdOasis');
      const createdOasisSnapshot = await getDocs(createdOasisRef);

      // Combine both sets of oasis IDs
      const oasisIds = [
        ...joinedOasisSnapshot.docs.map(doc => doc.id),
        ...createdOasisSnapshot.docs.map(doc => doc.id)
      ];

      // Update each oasis where user is a member
      for (const oasisId of oasisIds) {
        try {
          // Update member profile
          const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
          batch.update(memberRef, { photoURL: url });

          // Update messages
          const messagesQuery = query(
            collection(db, 'oasis', oasisId, 'messages'),
            where('authorId', '==', user.uid)
          );
          const messageDocs = await getDocs(messagesQuery);
          messageDocs.forEach(doc => {
            batch.update(doc.ref, { authorPhotoURL: url });
          });

          // Update admin messages
          const adminMessagesQuery = query(
            collection(db, 'oasis', oasisId, 'adminMessages'),
            where('authorId', '==', user.uid)
          );
          const adminMessageDocs = await getDocs(adminMessagesQuery);
          adminMessageDocs.forEach(doc => {
            batch.update(doc.ref, { authorPhotoURL: url });
          });
        } catch (error) {
          console.warn(`Failed to update data in oasis ${oasisId}:`, error);
          // Continue with other updates even if one fails
        }
      }

      // Commit all updates
      await batch.commit();

    } catch (error) {
      console.error('Error updating profile URL:', error);
      throw error;
    }
  };

  return (
    <ProfileContext.Provider value={{ userProfile, updateProfileUrl }}>
      {children}
    </ProfileContext.Provider>
  );
} 