import React, { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db, storage } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { ThemeColors } from '@/themes';
import { motion } from 'framer-motion';
import type { ThemeMode } from '@/components/ThemeSelector/ThemeMode';

interface CreatePostProps {
  oasisId: string;
  themeColors: ThemeColors;
  themeMode?: ThemeMode;
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  oasisId, 
  themeColors,
  themeMode = 'gradient',
  onPostCreated 
}) => {
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const getBackground = () => {
    switch (themeMode) {
      case 'gradient':
        return `linear-gradient(145deg, ${themeColors.primary}20, ${themeColors.secondary}20)`;
      case 'primary':
        return `${themeColors.primary}20`;
      case 'secondary':
        return `${themeColors.secondary}20`;
      default:
        return 'rgba(17, 24, 39, 0.3)';
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'File size must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachment(file);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to post.',
        variant: 'destructive',
      });
      return;
    }

    if (!newPost.trim() && !attachment) {
      toast({
        title: 'Error',
        description: 'Post content or attachment is required.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let attachmentData = null;

      if (attachment) {
        // Upload attachment first
        const storageRef = ref(storage, `oasis/${oasisId}/attachments/${Date.now()}_${attachment.name}`);
        const uploadResult = await uploadBytes(storageRef, attachment);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        attachmentData = {
          url: downloadURL,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size
        };
      }

      // Create post with attachment data if present
      await addDoc(collection(db, 'oasis', oasisId, 'posts'), {
        author: user.displayName || 'Anonymous',
        authorId: user.uid,
        content: newPost.trim(),
        attachment: attachmentData,
        timestamp: serverTimestamp(),
        likes: []
      });

      setNewPost('');
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onPostCreated?.();
      
      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePostSubmit} className="space-y-2">
      {attachment && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-2 px-3 py-1 bg-gray-800 rounded-md w-fit"
        >
          <span className="text-sm text-gray-300">{attachment.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveAttachment}
            className="p-1 h-auto hover:bg-gray-700"
          >
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        </motion.div>
      )}
      
      <div className="flex items-start space-x-2">
        <textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={newPost}
          onChange={(e) => {
            setNewPost(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyPress}
          className="flex-grow rounded-lg px-4 py-2 focus:outline-none focus:ring-2 min-h-[40px] max-h-[150px] resize-none"
          style={{
            borderColor: `${themeColors.accent}40`,
            background: getBackground(),
            color: themeColors.text,
          }}
        />
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleAttachmentClick}
            className="p-2 hover:bg-gray-700"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            style={{
              background: themeMode === 'gradient'
                ? themeColors.buttonGradient
                : themeMode === 'primary'
                ? themeColors.primary
                : themeColors.secondary,
              color: themeColors.buttonText,
            }}
            className="transition-transform hover:scale-105"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreatePost;