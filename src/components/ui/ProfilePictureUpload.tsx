import React, { useRef } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { storage, auth } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from './use-toast';
import { useProfileContext } from '@/contexts/ProfileContext';

interface ProfilePictureUploadProps {
  currentPhotoURL?: string;
  size?: 'sm' | 'md' | 'lg';
  onUploadComplete?: (url: string) => void;
  className?: string;
  skipProfileUpdate?: boolean;
  isEditing?: boolean;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24'
};

export function ProfilePictureUpload({ 
  currentPhotoURL, 
  size = 'md',
  onUploadComplete,
  className,
  skipProfileUpdate = false,
  isEditing = false
}: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { updateProfileUrl } = useProfileContext();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image size should be less than 5MB');
      }

      // Upload to Firebase Storage
      const storageRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // Only update profile if not skipped
      if (!skipProfileUpdate) {
        await updateProfileUrl(downloadUrl);
      }

      if (onUploadComplete) {
        onUploadComplete(downloadUrl);
      }

      toast({
        title: "Success",
        description: skipProfileUpdate ? 
          "Image uploaded successfully" : 
          "Profile picture updated successfully"
      });
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive"
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const shinyBlackIconButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '32px',
    height: '32px',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'absolute' as const,
    bottom: '-4px',
    right: '-4px',
    borderRadius: '50%',
  };

  return (
    <div className={`relative ${className}`}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={currentPhotoURL} />
        <AvatarFallback>
          {auth.currentUser?.displayName?.[0]?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        disabled={!isEditing}
      />
      
      {isEditing && (
        <button
          style={shinyBlackIconButtonStyle}
          className="hover:opacity-90"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
        </button>
      )}
    </div>
  );
} 