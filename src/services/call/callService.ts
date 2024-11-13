import { WebRTCService } from './webRTCService';
import { AudioService } from './audioService';
import { RecordingService } from './recordingService';
import { db, storage } from '@/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Call, CallParticipant, ChatMessage } from '@/types/call';

export class CallService {
  private webRTC: WebRTCService;
  private audio: AudioService;
  private recording: RecordingService;
  private chatUnsubscribe: (() => void) | null = null;
  private callDocRef: any = null;
  private isHost: boolean = false;

  constructor(
    private oasisId: string,
    private userId: string,
    private userName: string,
    private onAudioLevel: (userId: string, level: number) => void,
    private onNewMessage?: (message: ChatMessage) => void
  ) {
    if (!oasisId || !userId || !userName) {
      throw new Error('Missing required parameters for CallService');
    }

    this.webRTC = new WebRTCService();
    this.audio = new AudioService();
    this.recording = new RecordingService();
  }

  private async checkAdminAccess(): Promise<boolean> {
    try {
      const oasisRef = doc(db, 'oasis', this.oasisId);
      const oasisDoc = await getDoc(oasisRef);
      if (!oasisDoc.exists()) throw new Error('Oasis not found');

      // Check if user is owner
      if (oasisDoc.data().ownerId === this.userId) return true;

      // Check if user is admin
      const memberRef = doc(db, 'oasis', this.oasisId, 'members', this.userId);
      const memberDoc = await getDoc(memberRef);
      if (!memberDoc.exists()) return false;

      return memberDoc.data().role === 'admin';
    } catch (error) {
      console.error('Error checking admin access:', error);
      return false;
    }
  }

  async startCall(): Promise<string> {
    const hasAccess = await this.checkAdminAccess();
    if (!hasAccess) {
      throw new Error('You must be an owner or admin to start admin calls');
    }

    this.isHost = true;
    try {
      const stream = await this.webRTC.initialize();
      this.callDocRef = await this.createCallDocument();

      await this.audio.setupAudioAnalysis(stream, (level) => 
        this.onAudioLevel(this.userId, level)
      );

      await this.recording.startRecording(stream);

      this.subscribeToChatMessages(this.callDocRef.id);
      return this.callDocRef.id;
    } catch (error) {
      console.error('Error starting call:', error);
      await this.cleanup();
      throw error;
    }
  }

  async joinCall(callId: string): Promise<void> {
    const hasAccess = await this.checkAdminAccess();
    if (!hasAccess) {
      throw new Error('You must be an owner or admin to join admin calls');
    }

    this.isHost = false;
    try {
      this.callDocRef = doc(db, 'oasis', this.oasisId, 'adminCalls', callId);
      const callData = await this.getCallData();

      const stream = await this.webRTC.initialize();
      await this.addParticipantToCall(callData);

      await this.audio.setupAudioAnalysis(stream, (level) => 
        this.onAudioLevel(this.userId, level)
      );

      this.subscribeToChatMessages(callId);
    } catch (error) {
      console.error('Error joining call:', error);
      await this.cleanup();
      throw error;
    }
  }

  async endCall(): Promise<void> {
    if (!this.callDocRef) return;

    try {
      const callData = await this.getCallData();

      if (this.isHost) {
        await this.handleRecordingEnd();
      } else {
        await this.removeParticipant(callData);
      }

      await this.cleanup();
    } catch (error) {
      console.error('Error ending call:', error);
      await this.cleanup();
      throw error;
    }
  }

  async sendMessage(content: string): Promise<void> {
    if (!this.callDocRef) throw new Error('No active call');
    await this.addChatMessage(content, 'text');
  }

  async uploadFile(file: File): Promise<void> {
    if (!this.callDocRef) throw new Error('No active call');
    const fileUrl = await this.uploadFileToStorage(file);
    await this.addChatMessage(`Shared file: ${file.name}`, 'file', fileUrl, file.name);
  }

  private subscribeToChatMessages(callId: string): void {
    const messagesRef = collection(this.callDocRef, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(100));

    this.chatUnsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && this.onNewMessage) {
          const data = change.doc.data();
          this.onNewMessage({
            id: change.doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        }
      });
    });
  }

  private async cleanup(): Promise<void> {
    try {
      this.chatUnsubscribe?.();
      await Promise.all([this.webRTC.cleanup(), this.audio.cleanup()]);
      this.recording.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      this.chatUnsubscribe = null;
      this.callDocRef = null;
      this.isHost = false;
    }
  }

  private async createCallDocument(): Promise<any> {
    const callsRef = collection(db, 'oasis', this.oasisId, 'adminCalls');
    return await addDoc(callsRef, {
      startedAt: serverTimestamp(),
      status: 'active',
      hostId: this.userId,
      participants: [{
        userId: this.userId,
        userName: this.userName,
        role: 'host',
        joinedAt: serverTimestamp()
      }],
      documents: []
    });
  }

  private async getCallData(): Promise<any> {
    const callDoc = await getDoc(this.callDocRef);
    if (!callDoc.exists()) throw new Error('Call not found');
    return callDoc.data();
  }

  private async addParticipantToCall(callData: any): Promise<void> {
    const newParticipant: CallParticipant = {
      userId: this.userId,
      userName: this.userName,
      role: 'participant',
      joinedAt: new Date()
    };

    await updateDoc(this.callDocRef, {
      participants: [...callData.participants, newParticipant]
    });
  }

  private async removeParticipant(callData: any): Promise<void> {
    const updatedParticipants = callData.participants.filter(
      (p: CallParticipant) => p.userId !== this.userId
    );
    await updateDoc(this.callDocRef, {
      participants: updatedParticipants
    });
  }

  private async handleRecordingEnd(): Promise<void> {
    try {
      const recordingBlob = await this.recording.stopRecording();

      if (recordingBlob) {
        const recordingPath = `oasis/${this.oasisId}/adminCalls/${this.callDocRef.id}/recording.webm`;
        const storageRef = ref(storage, recordingPath);
        await uploadBytes(storageRef, recordingBlob);
        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(this.callDocRef, {
          recordingUrl: downloadURL,
          endedAt: serverTimestamp(),
          status: 'completed'
        });
      } else {
        await updateDoc(this.callDocRef, {
          endedAt: serverTimestamp(),
          status: 'completed'
        });
      }
    } catch (error) {
      console.error('Error in handleRecordingEnd:', error);
      await updateDoc(this.callDocRef, {
        endedAt: serverTimestamp(),
        status: 'completed'
      });
    }
  }

  private async uploadFileToStorage(file: File): Promise<string> {
    const fileRef = ref(storage, `oasis/${this.oasisId}/adminCalls/${this.callDocRef.id}/files/${file.name}`);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  }

  private async addChatMessage(content: string, type: string, fileUrl?: string, fileName?: string): Promise<void> {
    const messagesRef = collection(this.callDocRef, 'messages');
    await addDoc(messagesRef, {
      userId: this.userId,
      userName: this.userName,
      content,
      type,
      fileUrl,
      fileName,
      timestamp: serverTimestamp()
    });
  }
}