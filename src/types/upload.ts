import { Timestamp } from 'firebase/firestore';

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
  name: string;
  url: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface EmoteUpload {
  file: File;
  name: string;
}