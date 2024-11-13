import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface UploadedDocument {
  id?: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

const DOCUMENTS_COLLECTION = 'documents';
const CALLS_COLLECTION = 'calls';

export const uploadDocument = async (
  file: File,
  callId: string,
  userId: string
): Promise<UploadedDocument> => {
  validateInputs(file, callId, userId);

  try {
    const filePath = generateFilePath(file.name, callId);
    const fileRef = ref(storage, filePath);

    // Upload the file to Firebase Storage
    const snapshot = await uploadBytes(fileRef, file);

    // Retrieve the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Prepare document metadata
    const documentData: UploadedDocument = {
      name: file.name,
      url: downloadURL,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    // Save metadata in Firestore
    const docRef = await addDoc(collection(db, CALLS_COLLECTION, callId, DOCUMENTS_COLLECTION), {
      ...documentData,
      uploadedAt: serverTimestamp()
    });

    return { ...documentData, id: docRef.id };
  } catch (error) {
    console.error(`Error uploading document for call ID ${callId}:`, error);
    throw new Error(`Failed to upload document. Please try again.`);
  }
};

// Helper function to validate inputs
const validateInputs = (file: File, callId: string, userId: string): void => {
  if (!file) throw new Error('File is required.');
  if (!callId) throw new Error('Call ID is required.');
  if (!userId) throw new Error('User ID is required.');
};

// Helper function to generate a safe file path
const generateFilePath = (fileName: string, callId: string): string => {
  const timestamp = Date.now();
  const safeName = encodeURIComponent(fileName.replace(/[^a-zA-Z0-9.-]/g, '_'));
  return `${CALLS_COLLECTION}/${callId}/${DOCUMENTS_COLLECTION}/${timestamp}_${safeName}`;
};
