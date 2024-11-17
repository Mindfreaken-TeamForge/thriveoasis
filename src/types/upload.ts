import { Timestamp } from 'firebase/firestore';
import { doc, runTransaction, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  oasisId: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadError {
  code: string;
  message: string;
  details?: any;
}

export interface Emote {
  id: string;
  baseName: string;
  uniqueId: string;
  fullName: string;
  url: string;
  createdAt: Timestamp;
  createdBy: string;
  serverId?: string;
}

export interface EmoteUpload {
  file: File;
  baseName: string;
}

export interface OasisEmoteCounter {
  oasisEmoteId: string;
  totalEmotes: number;
  lastUpdate: Timestamp;
}

export async function getOasisEmoteId(oasisId: string): Promise<string> {
  const oasisRef = doc(db, 'oasis', oasisId);
  
  try {
    return await runTransaction(db, async (transaction) => {
      const oasisDoc = await transaction.get(oasisRef);
      
      if (!oasisDoc.exists()) {
        throw new Error('Oasis not found');
      }

      const currentData = oasisDoc.data();
      
      if (!currentData.emoteCounter?.oasisEmoteId) {
        const newEmoteId = await generateNextOasisId();
        const initialCounter: OasisEmoteCounter = {
          oasisEmoteId: newEmoteId,
          totalEmotes: 0,
          lastUpdate: serverTimestamp() as Timestamp,
        };
        
        transaction.update(oasisRef, {
          emoteCounter: initialCounter
        });
        
        return newEmoteId;
      }

      return currentData.emoteCounter.oasisEmoteId;
    });
  } catch (error) {
    console.error('Error getting oasis emote ID:', error);
    throw error;
  }
}

async function generateNextOasisId(): Promise<string> {
  const counterRef = doc(db, 'system', 'oasisEmoteCounter');
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    if (!counterDoc.exists()) {
      transaction.set(counterRef, { currentId: 'AAB' });
      return 'AAA';
    }
    
    const currentId = counterDoc.data().currentId;
    const nextId = generateNextId(currentId);
    
    transaction.update(counterRef, { currentId: nextId });
    return currentId;
  });
}

function generateNextId(currentId: string): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const arr = currentId.split('');
  let index = arr.length - 1;
  
  while (index >= 0) {
    const currentChar = arr[index];
    const currentIndex = chars.indexOf(currentChar);
    
    if (currentIndex < chars.length - 1) {
      arr[index] = chars[currentIndex + 1];
      return arr.join('');
    } else {
      arr[index] = chars[0];
      index--;
    }
  }
  
  return '0'.repeat(currentId.length + 1);
}

export async function createEmote(oasisId: string, file: File, baseName: string): Promise<Emote> {
  const sanitizedName = baseName.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');

  if (!sanitizedName) {
    throw new Error('Invalid emote name');
  }

  const oasisEmoteId = await getOasisEmoteId(oasisId);
  const fullName = formatEmoteName(sanitizedName, oasisEmoteId, oasisId);
  
  const storageRef = ref(storage, `oasis/${oasisId}/emotes/${fullName}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  const emoteData = {
    baseName: sanitizedName,
    uniqueId: oasisEmoteId,
    fullName,
    url,
    createdAt: serverTimestamp(),
    createdBy: auth.currentUser!.uid,
    serverId: oasisId
  };
  
  const docRef = await addDoc(collection(db, 'oasis', oasisId, 'emotes'), emoteData);
  
  await updateDoc(doc(db, 'oasis', oasisId), {
    'emoteCounter.totalEmotes': increment(1),
    'emoteCounter.lastUpdate': serverTimestamp()
  });
  
  return { id: docRef.id, ...emoteData } as Emote;
}

export function generateEmoteId(length: number = 3): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatEmoteName(baseName: string, uniqueId: string, serverId?: string): string {
  const serverPrefix = serverId ? `${serverId}_` : '';
  return `${serverPrefix}${baseName}_${uniqueId}`;
}

export function parseEmoteName(fullName: string): { baseName: string; uniqueId: string; serverId?: string } {
  const parts = fullName.split('_');
  if (parts.length === 2) {
    return {
      baseName: parts[0],
      uniqueId: parts[1]
    };
  } else if (parts.length === 3) {
    return {
      serverId: parts[0],
      baseName: parts[1],
      uniqueId: parts[2]
    };
  }
  throw new Error('Invalid emote name format');
}

export function formatEmoteDisplay(emote: Emote): string {
  return `:${emote.baseName}:${emote.uniqueId}:`;
}

export async function initializeOasisEmoteId(oasisId: string): Promise<void> {
  const oasisRef = doc(db, 'oasis', oasisId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const oasisDoc = await transaction.get(oasisRef);
      
      if (!oasisDoc.exists()) {
        throw new Error('Oasis not found');
      }

      const currentData = oasisDoc.data();
      
      if (!currentData.emoteCounter?.oasisEmoteId) {
        const newEmoteId = await generateNextOasisId();
        const initialCounter: OasisEmoteCounter = {
          oasisEmoteId: newEmoteId,
          totalEmotes: 0,
          lastUpdate: serverTimestamp() as Timestamp,
        };
        
        transaction.update(oasisRef, {
          emoteCounter: initialCounter
        });
      }
    });
  } catch (error) {
    console.error('Error initializing oasis emote ID:', error);
    throw error;
  }
}