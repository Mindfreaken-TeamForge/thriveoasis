import {
  collection,
  doc,
  getDoc,
  updateDoc,
  increment,
  runTransaction,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

interface OasisData {
  name: string;
  type: string;
  theme: string;
  imageUrl?: string;
  color: string;
  ownerId: string;
  tier?: string;
  features?: string[];
  extraEmotes?: number;
  extraStickers?: number;
  monthlyPrice?: number;
}

export const createOasis = async (oasisData: OasisData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to create an oasis');
    }

    // First create the oasis document
    const oasisRef = doc(collection(db, 'oasis'));
    const enrichedOasisData = {
      ...oasisData,
      ownerId: currentUser.uid,
      createdAt: serverTimestamp(),
      memberCount: 1,
      status: 'active'
    };

    // Do these operations sequentially instead of in a transaction
    await setDoc(oasisRef, enrichedOasisData);

    // Then create the owner's member document
    const memberRef = doc(db, 'oasis', oasisRef.id, 'members', currentUser.uid);
    await setDoc(memberRef, {
      userId: currentUser.uid,
      role: 'owner',
      permissions: ['administrator'],
      joinedAt: serverTimestamp(),
      status: 'active'
    });

    // Finally add to user's created oasis collection
    const userOasisRef = doc(db, 'users', currentUser.uid, 'createdOasis', oasisRef.id);
    await setDoc(userOasisRef, {
      oasisId: oasisRef.id,
      name: oasisData.name,
      type: oasisData.type,
      theme: oasisData.theme,
      createdAt: serverTimestamp(),
      status: 'active'
    });

    return oasisRef.id;
  } catch (error) {
    console.error('Error creating oasis:', error);
    throw error;
  }
};

export const joinOasis = async ({
  userId,
  userName,
  oasisId,
  permissions,
}: {
  userId: string;
  userName: string;
  oasisId: string;
  permissions: string[];
}): Promise<{ success: boolean; error?: string; oasisName?: string; oasisType?: string }> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const oasisRef = doc(db, 'oasis', oasisId);
      const oasisDoc = await transaction.get(oasisRef);

      if (!oasisDoc.exists()) {
        return {
          success: false,
          error: 'Oasis not found',
        };
      }

      const oasisData = oasisDoc.data();

      // Check if user is already a member
      const memberRef = doc(db, 'oasis', oasisId, 'members', userId);
      const memberDoc = await transaction.get(memberRef);

      if (memberDoc.exists()) {
        return {
          success: false,
          error: 'Already a member of this oasis',
        };
      }

      // Add user to oasis members
      transaction.set(memberRef, {
        userId,
        userName,
        permissions,
        joinedAt: serverTimestamp(),
        role: 'member',
        status: 'active',
      });

      // Add oasis to user's joined oasis
      const userOasisRef = doc(db, 'users', userId, 'joinedOasis', oasisId);
      transaction.set(userOasisRef, {
        oasisId,
        name: oasisData.name,
        type: oasisData.type,
        theme: oasisData.theme,
        ownerId: oasisData.ownerId,
        joinedAt: serverTimestamp(),
        status: 'active',
      });

      // Increment member count
      transaction.update(oasisRef, {
        memberCount: increment(1),
      });

      return {
        success: true,
        oasisName: oasisData.name,
        oasisType: oasisData.type,
      };
    });
  } catch (error: any) {
    console.error('Error joining oasis:', error);
    return {
      success: false,
      error: error.message || 'Failed to join oasis',
    };
  }
};

export const getOasisDetails = async (oasisId: string) => {
  try {
    const oasisRef = doc(db, 'oasis', oasisId);
    const oasisDoc = await getDoc(oasisRef);
    
    if (!oasisDoc.exists()) {
      throw new Error('Oasis not found');
    }

    return {
      id: oasisDoc.id,
      ...oasisDoc.data(),
    };
  } catch (error) {
    console.error('Error getting oasis details:', error);
    throw error;
  }
};

export const getMemberCount = async (oasisId: string): Promise<number> => {
  try {
    const membersRef = collection(db, 'oasis', oasisId, 'members');
    const q = query(membersRef, where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting member count:', error);
    return 0;
  }
};