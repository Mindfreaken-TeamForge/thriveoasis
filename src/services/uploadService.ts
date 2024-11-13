import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { storage, db } from '../firebase';
import {
  UploadedFile,
  UploadProgress,
  UploadOptions,
  UploadError,
} from '../types/upload';

export class UploadService {
  private static readonly DEFAULT_MAX_SIZE = 250 * 1024 * 1024; // 250MB
  private static readonly PREMIUM_MAX_SIZE = 750 * 1024 * 1024; // 750MB
  private static readonly OASIS_FILES_PATH = 'oasis';

  private static validateFile(file: File, options?: UploadOptions): void {
    const maxSize = options?.maxSize || this.DEFAULT_MAX_SIZE;

    if (file.size > maxSize) {
      throw {
        code: 'file-too-large',
        message: `File size exceeds the ${maxSize / (1024 * 1024)}MB limit`,
        details: { fileSize: file.size, maxSize },
      } as UploadError;
    }

    if (options?.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw {
        code: 'invalid-file-type',
        message: 'File type not allowed',
        details: { fileType: file.type, allowedTypes: options.allowedTypes },
      } as UploadError;
    }
  }

  private static generateFilePath(oasisId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeName = encodeURIComponent(fileName.replace(/[^a-zA-Z0-9.-]/g, '_'));
    return `${this.OASIS_FILES_PATH}/${oasisId}/files/${timestamp}_${safeName}`;
  }

  private static async createFileDocument(
    oasisId: string,
    fileData: UploadedFile
  ): Promise<UploadedFile> {
    const docRef = await addDoc(collection(db, 'oasis', oasisId, 'files'), {
      ...fileData,
      uploadedAt: serverTimestamp(),
    });

    return { ...fileData, id: docRef.id };
  }

  static async uploadFile(
    file: File,
    oasisId: string,
    userId: string,
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    try {
      this.validateFile(file, options);
      const filePath = this.generateFilePath(oasisId, file.name);
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return await this.handleUpload(uploadTask, file, oasisId, userId, onProgress);
    } catch (error) {
      console.error(`Error during upload for oasis ID ${oasisId}:`, error);
      throw error;
    }
  }

  private static async handleUpload(
    uploadTask: ReturnType<typeof uploadBytesResumable>,
    file: File,
    oasisId: string,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => this.trackProgress(snapshot, onProgress),
        (error) => {
          console.error('Upload failed:', error);
          reject({
            code: 'upload-failed',
            message: 'Failed to upload file',
            details: error,
          } as UploadError);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const fileData: UploadedFile = {
              name: file.name,
              url: downloadURL,
              type: file.type,
              size: file.size,
              uploadedAt: new Date(),
              uploadedBy: userId,
              oasisId,
            };
            const fileDoc = await this.createFileDocument(oasisId, fileData);
            resolve(fileDoc);
          } catch (error) {
            console.error('Document creation failed:', error);
            reject({
              code: 'document-creation-failed',
              message: 'Failed to create file document in Firestore',
              details: error,
            } as UploadError);
          }
        }
      );
    });
  }

  private static trackProgress(snapshot: firebase.storage.UploadTaskSnapshot, onProgress?: (progress: UploadProgress) => void): void {
    if (onProgress) {
      onProgress({
        bytesTransferred: snapshot.bytesTransferred,
        totalBytes: snapshot.totalBytes,
        progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
        state: snapshot.state,
      });
    }
  }

  static async getFilesByOasis(oasisId: string): Promise<UploadedFile[]> {
    try {
      const filesRef = collection(db, 'oasis', oasisId, 'files');
      const snapshot = await getDocs(filesRef);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      })) as UploadedFile[];
    } catch (error) {
      throw {
        code: 'fetch-failed',
        message: 'Failed to fetch files',
        details: error,
      } as UploadError;
    }
  }

  static getMaxSizeForTier(isPremium: boolean): number {
    return isPremium ? this.PREMIUM_MAX_SIZE : this.DEFAULT_MAX_SIZE;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
