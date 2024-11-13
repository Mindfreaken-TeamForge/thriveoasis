export interface CallParticipant {
  userId: string;
  userName: string;
  role: 'host' | 'participant';
  joinedAt: Date;
}

export interface CallDocument {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Call {
  id: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed';
  hostId: string;
  participants: CallParticipant[];
  documents: CallDocument[];
  recordingUrl?: string;
}