import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, SmilePlus, Trash2, Edit2, History, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { auth, db } from '@/firebase';
import { useToast } from '@/components/ui/use-toast';
import { ThemeColors } from '@/themes';
import ReportDialog from './ReportDialog';
import ReactionPicker from './ReactionPicker';
import Reactions from './Reactions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, Timestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditHistory {
  content: string;
  editedAt: Timestamp | Date;
  editedBy: string;
}

interface Post {
  id: string;
  author: string;
  authorId: string;
  content: string;
  reactions?: Record<string, { count: number; users: string[] }>;
  timestamp: Date;
  editHistory?: EditHistory[];
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
}

interface PostProps {
  post: Post;
  oasisId: string;
  themeColors: ThemeColors;
  isFirstInGroup: boolean;
  previousPost?: Post;
}

const Post: React.FC<PostProps> = ({ post, oasisId, themeColors, isFirstInGroup, previousPost }) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [pickerAnchorEl, setPickerAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { toast } = useToast();
  const currentUser = auth.currentUser;

  const canModifyPost = currentUser && (
    post.authorId === currentUser.uid ||
    // Add staff role check here if needed
    false
  );

  const handleReactionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setPickerAnchorEl(event.currentTarget);
    setIsReactionPickerOpen(true);
  };

  const handleAddReaction = async (emoji: string) => {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to react to posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      const postRef = doc(db, 'oasis', oasisId, 'posts', post.id);
      const currentReactions = post.reactions || {};
      const currentReaction = currentReactions[emoji] || { count: 0, users: [] };
      const hasReacted = currentReaction.users?.includes(currentUser.uid);

      if (hasReacted) {
        // Remove reaction
        await updateDoc(postRef, {
          [`reactions.${emoji}.count`]: Math.max(0, (currentReaction.count || 1) - 1),
          [`reactions.${emoji}.users`]: arrayRemove(currentUser.uid)
        });
      } else {
        // Add reaction
        await updateDoc(postRef, {
          [`reactions.${emoji}.count`]: (currentReaction.count || 0) + 1,
          [`reactions.${emoji}.users`]: arrayUnion(currentUser.uid)
        });
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`group relative px-4 py-2 hover:bg-gray-800/30 transition-colors ${
          shouldShowHeader() ? 'mt-4' : 'mt-0.5'
        }`}
      >
        {shouldShowHeader() && (
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${post.author}`} />
              <AvatarFallback>{post.author[0]}</AvatarFallback>
            </Avatar>
            <div>
              <span className="font-semibold text-white">{post.author}</span>
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
                onChange={(e) => setEditedContent(e.target.value)}
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
            <p className="text-white whitespace-pre-wrap break-words pr-16 leading-relaxed ml-10">
              {post.content}
            </p>
          )}

          <div className="ml-10">
            <Reactions
              reactions={reactionsList}
              onToggleReaction={handleAddReaction}
              currentUserId={auth.currentUser?.uid}
            />
          </div>
          
          <div className="absolute right-4 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex justify-center items-center flex-wrap space-x-2">
              <Button
                size="icon"
                onClick={handleReactionClick}
                className="bg-transparent hover:bg-yellow-500/20 w-8 h-8 p-2"
              >
                <SmilePlus className="w-4 h-4 text-white" />
              </Button>

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

      <ReactionPicker
        isOpen={isReactionPickerOpen}
        onClose={() => {
          setIsReactionPickerOpen(false);
          setPickerAnchorEl(null);
        }}
        onSelectReaction={handleAddReaction}
        anchorEl={pickerAnchorEl}
      />

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        postId={post.id}
        oasisId={oasisId}
        themeColors={themeColors}
      />

      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {post.editHistory?.map((edit, index) => (
              <div key={index} className="border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">
                    Edited by {edit.editedBy}
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatEditTime(edit.editedAt)}
                  </span>
                </div>
                <p className="text-white whitespace-pre-wrap">{edit.content}</p>
              </div>
            ))}
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Current version</span>
              </div>
              <p className="text-white whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Post;