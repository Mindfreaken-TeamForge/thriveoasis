import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export type UserRole = 'owner' | 'administrator' | 'moderator' | null;

export function useUserRole(oasisId: string, userId: string | undefined) {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId || !oasisId) return;

      try {
        const memberRef = doc(db, 'oasis', oasisId, 'members', userId);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const data = memberDoc.data();
          if (data.role === 'owner') {
            setRole('owner');
          } else if (data.permissions?.includes('administrator')) {
            setRole('administrator');
          } else if (data.permissions?.includes('moderate_content')) {
            setRole('moderator');
          } else {
            setRole(null);
          }
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      }
    };

    fetchUserRole();
  }, [oasisId, userId]);

  return role;
} 