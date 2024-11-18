import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const PollManager: React.FC<PollManagerProps> = ({ oasisId }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !oasisId) return;

      try {
        const memberRef = doc(db, 'oasis', oasisId, 'members', user.uid);
        const memberDoc = await getDoc(memberRef);
        
        if (memberDoc.exists()) {
          const data = memberDoc.data();
          // Check if user is owner or admin
          const hasAccess = 
            data.role === 'owner' || 
            data.permissions?.includes('administrator');
          setHasAccess(hasAccess);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, [user, oasisId]);

  // Only render polls if user has access
  if (!hasAccess) {
    return null;
  }

  // Rest of your component code...
};

export default PollManager; 