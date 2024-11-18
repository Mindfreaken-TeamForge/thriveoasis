import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, getDoc, updateDoc, collection, writeBatch, getDocs, query, where, serverTimestamp, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface UserProfile {
  displayName: string;
  photoURL: string;
  role: string;
  bio?: string;
  lastUpdated?: Date;
  permissions?: string[];
}

interface ProfileContextType {
  userProfile: UserProfile | null;
  updateProfileUrl: (url: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

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
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
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
  }, []);

  const updateDisplayName = async (name: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await updateProfile(user, { displayName: name });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: name,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        lastUpdated: serverTimestamp()
      });

      if (updates.displayName) {
        await updateProfile(user, { displayName: updates.displayName });
      }
      if (updates.photoURL) {
        await updateProfile(user, { photoURL: updates.photoURL });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

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
      const joinedOasisRef = collection(db, 'users', user.uid, 'joinedOasis');
      const joinedOasisSnapshot = await getDocs(joinedOasisRef);

      const createdOasisRef = collection(db, 'users', user.uid, 'createdOasis');
      const createdOasisSnapshot = await getDocs(createdOasisRef);

      const oasisIds = [
        ...joinedOasisSnapshot.docs.map(doc => doc.id),
        ...createdOasisSnapshot.docs.map(doc => doc.id)
      ];

      // Update each oasis individually
      for (const oasisId of oasisIds) {
        try {
          // First verify membership and get current role/permissions
          const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
          const memberDoc = await getDoc(memberRef);

          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            // Only update if we're already a member
            await updateDoc(memberRef, { 
              photoURL: url,
              lastUpdated: serverTimestamp(),
              // Preserve existing role and permissions
              role: memberData.role || 'member',
              permissions: memberData.permissions || ['send_messages']
            });

            // Update messages only if we're a member
            const messagesQuery = query(
              collection(db, 'oasis', oasisId, 'messages'),
              where('authorId', '==', user.uid)
            );
            const messageDocs = await getDocs(messagesQuery);
            
            for (const doc of messageDocs.docs) {
              await updateDoc(doc.ref, { 
                authorPhotoURL: url,
                lastUpdated: serverTimestamp()
              });
            }

            // Update admin messages only if we're a member
            const adminMessagesQuery = query(
              collection(db, 'oasis', oasisId, 'adminMessages'),
              where('authorId', '==', user.uid)
            );
            const adminMessageDocs = await getDocs(adminMessagesQuery);
            
            for (const doc of adminMessageDocs.docs) {
              await updateDoc(doc.ref, { 
                authorPhotoURL: url,
                lastUpdated: serverTimestamp()
              });
            }
          } else {
            // Clean up references if we're not actually a member
            const joinedRef = doc(db, 'users', user.uid, 'joinedOasis', oasisId);
            const createdRef = doc(db, 'users', user.uid, 'createdOasis', oasisId);
            
            const cleanupTasks = [];
            
            const joinedDoc = await getDoc(joinedRef);
            if (joinedDoc.exists()) {
              cleanupTasks.push(deleteDoc(joinedRef));
            }
            
            const createdDoc = await getDoc(createdRef);
            if (createdDoc.exists()) {
              cleanupTasks.push(deleteDoc(createdRef));
            }
            
            await Promise.all(cleanupTasks);
          }
        } catch (error) {
          console.warn(`Failed to update data in oasis ${oasisId}:`, error);
        }
      }

    } catch (error) {
      console.error('Error updating profile URL:', error);
      throw error;
    }
  };

  const contextValue: ProfileContextType = {
    userProfile,
    updateProfileUrl,
    updateDisplayName,
    updateUserProfile
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export default ProfileContext; 