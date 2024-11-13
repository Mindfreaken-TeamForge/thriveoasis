import { db } from '../firebase';
import { 
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
  collectionGroup,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { generateUniqueId } from '../utils/helpers';

export interface Token {
  id: string;
  code: string;
  type: 'permanent' | 'temporary';
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isEnabled: boolean;
  maxUses?: number;
  currentUses: number;
  oasisId: string;
  oasisName: string;
  permissions: string[];
}

export interface TokenUsage {
  id: string;
  tokenId: string;
  userId: string;
  usedAt: Date;
  oasisId: string;
}

export interface InviteRelation {
  inviterId: string;
  inviteeId: string;
  tokenId: string;
  oasisId: string;
  timestamp: Date;
}

class TokenService {
  private generateTokenCode(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = generateUniqueId();
    return `${timestamp}-${randomStr}`;
  }

  async createPermanentToken(
    oasisId: string,
    creatorId: string,
    maxUses?: number
  ): Promise<Token> {
    if (!oasisId || !creatorId) {
      throw new Error('Missing required parameters');
    }

    try {
      // Verify oasis exists and creator has permission
      const oasisRef = doc(db, 'oasis', oasisId);
      const oasisSnap = await getDoc(oasisRef);
      
      if (!oasisSnap.exists()) {
        throw new Error('Oasis not found');
      }

      const oasisData = oasisSnap.data();
      const hasPermission = oasisData.ownerId === creatorId || 
        (oasisData.admins && oasisData.admins.includes(creatorId));

      if (!hasPermission) {
        throw new Error('Insufficient permissions to create tokens');
      }

      // Create token data
      const tokenData = {
        code: this.generateTokenCode(),
        type: 'permanent' as const,
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        isEnabled: true,
        maxUses: maxUses || null,
        currentUses: 0,
        oasisId,
        oasisName: oasisData.name,
        permissions: ['member']
      };

      // Create token in Firestore
      const tokenRef = await addDoc(collection(db, 'oasis', oasisId, 'tokens'), tokenData);

      // Return token with proper date conversion
      return {
        id: tokenRef.id,
        ...tokenData,
        createdAt: new Date(),
        permissions: ['member']
      } as Token;
    } catch (error) {
      console.error('Error creating permanent token:', error);
      throw error;
    }
  }

  async createTemporaryToken(
    oasisId: string,
    creatorId: string,
    expirationHours: number,
    maxUses?: number
  ): Promise<Token> {
    if (!oasisId || !creatorId || !expirationHours) {
      throw new Error('Missing required parameters');
    }

    if (expirationHours <= 0 || expirationHours > 720) { // Max 30 days
      throw new Error('Invalid expiration time');
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // Verify oasis exists and creator has permission
      const oasisRef = doc(db, 'oasis', oasisId);
      const oasisSnap = await getDoc(oasisRef);
      
      if (!oasisSnap.exists()) {
        throw new Error('Oasis not found');
      }

      const oasisData = oasisSnap.data();
      const hasPermission = oasisData.ownerId === creatorId || 
        (oasisData.admins && oasisData.admins.includes(creatorId));

      if (!hasPermission) {
        throw new Error('Insufficient permissions to create tokens');
      }

      // Create token data
      const tokenData = {
        code: this.generateTokenCode(),
        type: 'temporary' as const,
        createdBy: creatorId,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        isEnabled: true,
        maxUses: maxUses || null,
        currentUses: 0,
        oasisId,
        oasisName: oasisData.name,
        permissions: ['member']
      };

      // Create token in Firestore
      const tokenRef = await addDoc(collection(db, 'oasis', oasisId, 'tokens'), tokenData);

      // Return token with proper date conversion
      return {
        id: tokenRef.id,
        ...tokenData,
        createdAt: new Date(),
        expiresAt,
        permissions: ['member']
      } as Token;
    } catch (error) {
      console.error('Error creating temporary token:', error);
      throw error;
    }
  }

  async validateToken(code: string): Promise<{ success: boolean; token?: Token; error?: string }> {
    if (!code) {
      return { success: false, error: 'Invalid invite code' };
    }

    try {
      // Query across all oasis for the token
      const tokensQuery = query(
        collectionGroup(db, 'tokens'),
        where('code', '==', code),
        where('isEnabled', '==', true),
        limit(1)
      );

      const tokenSnap = await getDocs(tokensQuery);
      
      if (tokenSnap.empty) {
        return { success: false, error: 'Invalid invite code' };
      }

      const tokenDoc = tokenSnap.docs[0];
      const tokenData = tokenDoc.data();

      // Check if token is expired
      if (tokenData.expiresAt && new Date() > tokenData.expiresAt.toDate()) {
        return { success: false, error: 'Invite code has expired' };
      }

      // Check if max uses reached
      if (tokenData.maxUses && tokenData.currentUses >= tokenData.maxUses) {
        return { success: false, error: 'Invite code has reached maximum uses' };
      }

      return {
        success: true,
        token: {
          id: tokenDoc.id,
          ...tokenData,
          createdAt: tokenData.createdAt.toDate(),
          expiresAt: tokenData.expiresAt?.toDate(),
          permissions: tokenData.permissions || ['member']
        } as Token
      };
    } catch (error) {
      console.error('Error validating token:', error);
      return { success: false, error: 'Failed to validate invite code' };
    }
  }

  async useToken(tokenId: string, userId: string, oasisId: string): Promise<void> {
    if (!tokenId || !userId || !oasisId) {
      throw new Error('Missing required parameters');
    }

    try {
      const tokenRef = doc(db, 'oasis', oasisId, 'tokens', tokenId);
      const tokenDoc = await getDoc(tokenRef);

      if (!tokenDoc.exists()) {
        throw new Error('Token not found');
      }

      if (!tokenDoc.data().isEnabled) {
        throw new Error('Token is disabled');
      }

      // Update token usage count
      await updateDoc(tokenRef, {
        currentUses: increment(1)
      });

      // Record usage
      await addDoc(collection(db, 'oasis', oasisId, 'tokenUsage'), {
        tokenId,
        userId,
        usedAt: serverTimestamp(),
        oasisId
      });
    } catch (error) {
      console.error('Error using token:', error);
      throw error;
    }
  }

  async recordInviteRelation(
    inviterId: string,
    inviteeId: string,
    tokenId: string,
    oasisId: string
  ): Promise<void> {
    if (!inviterId || !inviteeId || !tokenId || !oasisId) {
      throw new Error('Missing required parameters');
    }

    try {
      await addDoc(collection(db, 'oasis', oasisId, 'inviteRelations'), {
        inviterId,
        inviteeId,
        tokenId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error recording invite relation:', error);
      throw error;
    }
  }

  async getTokenUsageAnalytics(tokenId: string, oasisId: string): Promise<TokenUsage[]> {
    if (!tokenId || !oasisId) {
      throw new Error('Missing required parameters');
    }

    try {
      const usageRef = collection(db, 'oasis', oasisId, 'tokenUsage');
      const q = query(usageRef, where('tokenId', '==', tokenId), orderBy('usedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        usedAt: (doc.data().usedAt as Timestamp).toDate(),
      })) as TokenUsage[];
    } catch (error) {
      console.error('Error getting token usage analytics:', error);
      return [];
    }
  }

  async getInviterStats(inviterId: string, oasisId: string): Promise<number> {
    if (!inviterId || !oasisId) {
      throw new Error('Missing required parameters');
    }

    try {
      const relationsRef = collection(db, 'oasis', oasisId, 'inviteRelations');
      const q = query(relationsRef, where('inviterId', '==', inviterId));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting inviter stats:', error);
      return 0;
    }
  }

  async getInviteesByInviter(inviterId: string, oasisId: string): Promise<InviteRelation[]> {
    if (!inviterId || !oasisId) {
      throw new Error('Missing required parameters');
    }

    try {
      const relationsRef = collection(db, 'oasis', oasisId, 'inviteRelations');
      const q = query(
        relationsRef,
        where('inviterId', '==', inviterId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: (doc.data().timestamp as Timestamp).toDate(),
      })) as InviteRelation[];
    } catch (error) {
      console.error('Error getting invitees:', error);
      return [];
    }
  }
}

export const tokenService = new TokenService();