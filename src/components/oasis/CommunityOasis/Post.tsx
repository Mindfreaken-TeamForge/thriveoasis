import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, SmilePlus, Trash2, Edit2, History, X, Check, Image, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { ThemeColors } from '@/themes';
import ReportDialog from './ReportDialog';
import { ReactionPicker } from './ReactionPicker';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, Timestamp, increment, deleteField, getDoc, onSnapshot } from 'firebase/firestore';
import type { ThemeMode } from '@/components/ThemeSelector/ThemeMode';
import type { Emote } from '@/types/upload';
import { useUserProfile } from '@/hooks/useUserProfiles';
import { useUserRole } from '@/hooks/useUserRole';

interface EditHistory {
  content: string;
  editedAt: Timestamp | Date;
  editedBy: string;
}

interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

interface UserProfile {
  photoURL?: string;
  displayName?: string;
}

interface Post {
  id: string;
  author: string;
  authorId: string;
  content: string;
  timestamp: Date;
  editHistory?: EditHistory[];
  attachment?: Attachment;
  reactions?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  customEmotes?: {
    [key: string]: {
      count: number;
      users: string[];
    };
  };
  userReactions?: {
    [userId: string]: string[];
  };
}

interface PostProps {
  post: Post;
  oasisId: string;
  themeColors: ThemeColors;
  themeMode: ThemeMode;
  isFirstInGroup: boolean;
  previousPost?: Post;
  onAttachmentLoad?: () => void;
  customEmotes: Emote[];
  oasisName: string;
}

const Post: React.FC<PostProps> = ({ 
  post, 
  oasisId, 
  themeColors,
  themeMode = 'gradient',
  isFirstInGroup, 
  previousPost,
  onAttachmentLoad,
  customEmotes,
  oasisName,
}) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { toast } = useToast();
  const currentUser = auth.currentUser;
  const userProfile = useUserProfile(post.authorId);
  const userRole = useUserRole(oasisId, post.authorId);

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

  const canModifyPost = currentUser && (
    post.authorId === currentUser.uid ||
    // Add staff role check here if needed
    false
  );

  const handleReactionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPickerAnchorEl(event.currentTarget);
    setIsReactionPickerOpen(true);
  };

  const handleReaction = async (emoteId: string, isCustomEmote: boolean = false) => {
    if (!auth.currentUser) return;

    try {
      const postRef = doc(db, 'users', auth.currentUser.uid, 'oasis', oasisId, 'posts', post.id);
      const reactionKey = isCustomEmote ? `customEmotes.${emoteId}` : `reactions.${emoteId}`;
      const userReactions = post.userReactions?.[auth.currentUser.uid] || [];
      const hasReacted = userReactions.includes(emoteId);

      if (hasReacted) {
        // Remove reaction
        const currentCount = isCustomEmote 
          ? post.customEmotes?.[emoteId]?.count || 0
          : post.reactions?.[emoteId]?.count || 0;

        if (currentCount <= 1) {
          // If this is the last reaction, remove the entire reaction entry
          await updateDoc(postRef, {
            [`${reactionKey}`]: deleteField(),
            [`userReactions.${auth.currentUser.uid}`]: arrayRemove(emoteId)
          });
        } else {
          // Otherwise just decrement the count
          await updateDoc(postRef, {
            [`${reactionKey}.count`]: increment(-1),
            [`${reactionKey}.users`]: arrayRemove(auth.currentUser.uid),
            [`userReactions.${auth.currentUser.uid}`]: arrayRemove(emoteId)
          });
        }
      } else {
        // Add reaction
        await updateDoc(postRef, {
          [`${reactionKey}`]: {
            count: increment(1),
            users: arrayUnion(auth.currentUser.uid)
          },
          [`userReactions.${auth.currentUser.uid}`]: arrayUnion(emoteId)
        });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'oasis', oasisId, 'posts', post.id));
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!currentUser || editedContent === post.content) return;

    try {
      const postRef = doc(db, 'oasis', oasisId, 'posts', post.id);
      const editHistoryEntry = {
        content: post.content,
        editedAt: new Date(),
        editedBy: currentUser.displayName || 'Unknown User',
      };

      await updateDoc(postRef, {
        content: editedContent,
        editHistory: arrayUnion(editHistoryEntry),
      });

      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Post updated successfully',
      });
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update post',
        variant: 'destructive',
      });
    }
  };

  const formatEditTime = (date: Date | Timestamp) => {
    let jsDate: Date;
    
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      return 'Invalid date';
    }

    if (isNaN(jsDate.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    }).format(jsDate);
  };

  const shouldShowHeader = () => {
    if (!previousPost) return true;
    if (previousPost.authorId !== post.authorId) return true;
    
    // Check if messages are more than 5 minutes apart
    const timeDiff = post.timestamp.getTime() - previousPost.timestamp.getTime();
    return timeDiff > 5 * 60 * 1000;
  };

  const reactionsList = post.reactions 
    ? Object.entries(post.reactions).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users || []
      }))
    : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageLoad = () => {
    onAttachmentLoad?.();
  };

  const renderAttachment = () => {
    if (!post.attachment) return null;

    const { type, url, name, size } = post.attachment;

    if (type.startsWith('image/')) {
      return (
        <div className="relative mt-2 group">
          <img
            src={url}
            alt={name}
            className="max-w-md max-h-96 rounded-lg object-contain bg-black/20"
            onLoad={handleImageLoad}
          />
          <a
            href={url}
            download={name}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button size="sm" className="bg-black/50 hover:bg-black/70">
              <Download className="w-4 h-4" />
            </Button>
          </a>
        </div>
      );
    }

    return (
      <div className="mt-2">
        <a
          href={url}
          download={name}
          className="flex items-center space-x-2 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors w-fit"
          onLoad={handleImageLoad}
        >
          <FileText className="w-5 h-5 text-blue-400" />
          <div className="flex flex-col">
            <span className="text-sm text-white">{name}</span>
            <span className="text-xs text-gray-400">{formatFileSize(size)}</span>
          </div>
          <Download className="w-4 h-4 text-gray-400" />
        </a>
      </div>
    );
  };

  return (
    <>
      <motion.div
        className={`group relative px-4 py-2 hover:bg-gray-800/30 transition-colors ${
          shouldShowHeader() ? 'mt-4' : 'mt-0.5'
        }`}
        style={{
          background: getBackground(),
        }}
      >
        {shouldShowHeader() && (
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage 
                src={
                  userProfile?.photoURL || 
                  `https://api.dicebear.com/6.x/initials/svg?seed=${post.author}`
                } 
                alt={post.author}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = `https://api.dicebear.com/6.x/initials/svg?seed=${post.author}`;
                }}
              />
              <AvatarFallback>{post.author[0]?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-white">
                {post.author}
                {userRole && (
                  <span 
                    className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      userRole === 'owner' 
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : userRole === 'administrator'
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {userRole === 'owner' 
                      ? 'Owner'
                      : userRole === 'administrator'
                      ? 'Admin'
                      : 'Mod'
                    }
                  </span>
                )}
              </span>
              <span className="text-sm text-gray-400 ml-2">
                {formatEditTime(post.timestamp)}
              </span>
              {post.editHistory && post.editHistory.length > 0 && (
                <button
                  onClick={() => setIsHistoryDialogOpen(true)}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-300"
                >
                  (edited)
                </button>
              )}
            </div>
          </div>
        )}
        
        <div className="relative group">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedContent(e.target.value)}
                className="w-full min-h-[100px] bg-gray-900/50 border-gray-700 text-white"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="ml-10">
              {post.content && (
                <p className="text-white whitespace-pre-wrap break-words pr-16 leading-relaxed">
                  {post.content}
                </p>
              )}
              {post.attachment && (
                <div className="relative mt-2 group">
                  {post.attachment.type.startsWith('image/') ? (
                    <div className="relative inline-block">
                      <img
                        src={post.attachment.url}
                        alt={post.attachment.name}
                        className="max-w-[300px] rounded-lg"
                        onLoad={onAttachmentLoad}
                      />
                      <a
                        href={post.attachment.url}
                        download={post.attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4 text-white" />
                      </a>
                    </div>
                  ) : (
                    <div className="relative inline-flex items-center p-3 rounded-lg bg-gray-800 group max-w-[300px]">
                      <FileText className="w-5 h-5 mr-2 text-gray-400" />
                      <span className="text-sm truncate">{post.attachment.name}</span>
                      <a
                        href={post.attachment.url}
                        download={post.attachment.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 p-2 rounded-full hover:bg-gray-700 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="ml-10">
            <div className="flex flex-wrap gap-2 mt-2">
              {/* Default Reactions */}
              {Object.entries(post.reactions || {}).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                    data.users?.includes(auth.currentUser?.uid || '') 
                      ? 'bg-primary/20'
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="text-xs font-medium">{data.count}</span>
                </button>
              ))}

              {/* Custom Emote Reactions */}
              {Object.entries(post.customEmotes || {}).map(([emoteId, data]) => {
                const emote = customEmotes.find(e => e.id === emoteId);
                if (!emote) return null;

                return (
                  <button
                    key={emoteId}
                    onClick={() => handleReaction(emoteId, true)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      data.users?.includes(auth.currentUser?.uid || '')
                        ? 'bg-primary/20'
                        : 'bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  >
                    <img 
                      src={emote.url} 
                      alt={emote.name}
                      className="w-5 h-5 object-contain"
                    />
                    <span className="text-xs font-medium">{data.count}</span>
                  </button>
                );
              })}

              {/* Reaction Picker */}
              <ReactionPicker
                onSelect={(emoji, isCustom) => handleReaction(emoji, isCustom)}
                customEmotes={customEmotes}
                oasisName={oasisName}
              />
            </div>
          </div>
          
          <div className="absolute right-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex justify-center items-center flex-wrap space-x-2">
              {canModifyPost && (
                <>
                  <Button
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="bg-transparent hover:bg-blue-500/20 w-8 h-8 p-2"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleDelete}
                    className="bg-transparent hover:bg-red-500/20 w-8 h-8 p-2"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </>
              )}

              <Button
                size="icon"
                onClick={() => setIsReportDialogOpen(true)}
                className="bg-transparent hover:bg-yellow-500/20 w-8 h-8 p-2"
              >
                <Flag className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        postId={post.id}
        oasisId={oasisId}
        themeColors={themeColors}
      />
    </>
  );
};

export default Post;