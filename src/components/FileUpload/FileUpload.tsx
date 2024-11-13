import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { auth, storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface FileUploadProps {
  oasisId: string;
  isPremium?: boolean;
  allowedTypes?: string[];
  onUploadComplete?: (url: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  oasisId,
  isPremium = false,
  allowedTypes = ['*'],
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxSize = isPremium ? 750 * 1024 * 1024 : 250 * 1024 * 1024; // 750MB for premium, 250MB for regular

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: `File size must be less than ${isPremium ? '750MB' : '250MB'}`,
        variant: 'destructive',
      });
      return;
    }

    // Check file type if allowedTypes are specified
    if (allowedTypes[0] !== '*') {
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(new RegExp(type.replace('*', '.*')));
      });

      if (!isAllowed) {
        toast({
          title: 'Error',
          description: 'Invalid file type',
          variant: 'destructive',
        });
        return;
      }
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to upload files',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `oasis/${oasisId}/files/${timestamp}_${selectedFile.name}`);
      
      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      if (onUploadComplete) {
        onUploadComplete(downloadUrl);
      }

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept={allowedTypes.join(',')}
      />

      {selectedFile ? (
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 truncate mr-4">
              <p className="text-white font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Uploading...
                  </div>
                ) : (
                  'Upload'
                )}
              </Button>
              <Button
                onClick={clearSelectedFile}
                disabled={isUploading}
                className="bg-gray-700 hover:bg-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700"
        >
          <Upload className="mr-2 h-4 w-4" />
          Select File ({isPremium ? '750MB' : '250MB'} max)
        </Button>
      )}
    </div>
  );
};